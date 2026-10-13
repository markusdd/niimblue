use std::{collections::HashMap, sync::Arc, time::Duration};

use btleplug::{
    api::{
        Central, CharPropFlags, Characteristic, Manager as _, Peripheral as _, ScanFilter,
        WriteType,
    },
    platform::{Manager, Peripheral},
};
use futures_util::StreamExt;
use serde::Serialize;
use tauri::{async_runtime::JoinHandle, AppHandle, Emitter, State};
use tokio::{
    sync::Mutex,
    time::{sleep, timeout},
};
use uuid::Uuid;

use crate::ble_policy::{printer_name, valid_write, WRITE_CHUNK_BYTES};

const SERVICE: Uuid = Uuid::from_u128(0xe7810a7173ae499d8c15faa9aef0c3f2);
const CHANNEL: Uuid = Uuid::from_u128(0xbef8d6c99c214c9eb632bd58c1009f9f);
const OPERATION_TIMEOUT: Duration = Duration::from_secs(15);

#[derive(Clone, Default)]
pub struct BleTransport {
    inner: Arc<Mutex<Inner>>,
}

impl BleTransport {
    pub async fn shutdown(&self) {
        let mut inner = self.inner.lock().await;
        if let Some(connection) = inner.active.take() {
            let _ = close(connection).await;
        }
    }
}

#[derive(Default)]
struct Inner {
    devices: HashMap<String, Peripheral>,
    active: Option<Connection>,
}

struct Connection {
    peripheral: Peripheral,
    characteristic: Characteristic,
    session_id: String,
    notifications: JoinHandle<()>,
    monitor: JoinHandle<()>,
}

#[derive(Serialize)]
pub struct Printer {
    id: String,
    name: String,
    rssi: Option<i16>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    session_id: String,
    device_name: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Notification {
    session_id: String,
    data: Vec<u8>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Disconnected {
    session_id: String,
    reason: String,
}

async fn close(connection: Connection) -> Result<(), String> {
    connection.notifications.abort();
    connection.monitor.abort();
    let _ = timeout(
        Duration::from_secs(3),
        connection
            .peripheral
            .unsubscribe(&connection.characteristic),
    )
    .await;
    timeout(OPERATION_TIMEOUT, connection.peripheral.disconnect())
        .await
        .map_err(|_| "Timed out disconnecting printer".to_string())?
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ble_scan(state: State<'_, BleTransport>) -> Result<Vec<Printer>, String> {
    let mut inner = state.inner.lock().await;
    if inner.active.is_some() {
        return Err("Disconnect the printer before scanning".into());
    }
    let manager = Manager::new().await.map_err(|e| e.to_string())?;
    let adapters = manager.adapters().await.map_err(|e| e.to_string())?;
    if adapters.is_empty() {
        return Err("No Bluetooth adapter found. Enable Bluetooth and try again.".into());
    }
    let mut scanning = Vec::new();
    let mut errors = Vec::new();
    for adapter in adapters {
        // BlueZ combines filters across clients. Filter printer advertisements ourselves.
        match timeout(OPERATION_TIMEOUT, adapter.start_scan(ScanFilter::default())).await {
            Ok(Ok(())) => scanning.push(adapter),
            Ok(Err(e)) => errors.push(e.to_string()),
            Err(_) => errors.push("Bluetooth discovery timed out".into()),
        }
    }
    if scanning.is_empty() {
        return Err(errors.join("; "));
    }
    sleep(Duration::from_secs(6)).await;
    inner.devices.clear();
    let mut printers = Vec::new();
    for adapter in scanning {
        let devices = timeout(OPERATION_TIMEOUT, adapter.peripherals()).await;
        // Always stop discovery, including when enumeration failed.
        let _ = timeout(Duration::from_secs(3), adapter.stop_scan()).await;
        let devices = match devices {
            Ok(Ok(devices)) => devices,
            Ok(Err(e)) => {
                errors.push(e.to_string());
                continue;
            }
            Err(_) => {
                errors.push("Bluetooth enumeration timed out".into());
                continue;
            }
        };
        for peripheral in devices {
            let properties = match timeout(Duration::from_secs(3), peripheral.properties()).await {
                Ok(Ok(Some(properties))) => properties,
                _ => continue,
            };
            let name = properties.local_name.unwrap_or_default();
            if !properties.services.contains(&SERVICE) && !printer_name(&name) {
                continue;
            }
            let id = peripheral.id().to_string();
            printers.push(Printer {
                id: id.clone(),
                name: if name.is_empty() {
                    "NIIMBOT printer".into()
                } else {
                    name
                },
                rssi: properties.rssi,
            });
            inner.devices.insert(id, peripheral);
        }
    }
    printers.sort_by(|a, b| {
        b.rssi
            .cmp(&a.rssi)
            .then(a.name.cmp(&b.name))
            .then(a.id.cmp(&b.id))
    });
    if printers.is_empty() && !errors.is_empty() {
        return Err(errors.join("; "));
    }
    Ok(printers)
}

#[tauri::command]
pub async fn ble_connect(
    app: AppHandle,
    state: State<'_, BleTransport>,
    device_id: String,
) -> Result<Session, String> {
    let mut inner = state.inner.lock().await;
    if let Some(previous) = inner.active.take() {
        close(previous).await?;
    }
    let peripheral = inner
        .devices
        .get(&device_id)
        .cloned()
        .ok_or("Printer not found. Scan for printers again.")?;
    let opened = async {
        peripheral.connect().await.map_err(|e| e.to_string())?;
        peripheral
            .discover_services()
            .await
            .map_err(|e| e.to_string())?;
        let characteristic = peripheral
            .characteristics()
            .into_iter()
            .find(|c| {
                c.service_uuid == SERVICE
                    && c.uuid == CHANNEL
                    && c.properties.contains(CharPropFlags::NOTIFY)
                    && c.properties.contains(CharPropFlags::WRITE_WITHOUT_RESPONSE)
            })
            .ok_or("The printer's Bluetooth data channel was not found")?;
        // Open the notification stream before subscribing to prevent missed bytes.
        let stream = peripheral
            .notifications()
            .await
            .map_err(|e| e.to_string())?;
        peripheral
            .subscribe(&characteristic)
            .await
            .map_err(|e| e.to_string())?;
        Ok::<_, String>((characteristic, stream))
    };
    let (characteristic, mut stream) = match timeout(OPERATION_TIMEOUT, opened).await {
        Ok(Ok(result)) => result,
        result => {
            let _ = timeout(OPERATION_TIMEOUT, peripheral.disconnect()).await;
            return Err(match result {
                Ok(Err(error)) => error,
                _ => "Timed out connecting to printer".into(),
            });
        }
    };
    let device_name = timeout(Duration::from_secs(3), peripheral.properties())
        .await
        .ok()
        .and_then(Result::ok)
        .flatten()
        .and_then(|p| p.local_name)
        .unwrap_or_else(|| "NIIMBOT printer".into());
    let session_id = Uuid::new_v4().to_string();
    let notify_id = session_id.clone();
    let notify_app = app.clone();
    let notifications = tauri::async_runtime::spawn(async move {
        while let Some(value) = stream.next().await {
            if value.uuid == CHANNEL {
                let _ = notify_app.emit_to(
                    "main",
                    "native-ble-data",
                    Notification {
                        session_id: notify_id.clone(),
                        data: value.value,
                    },
                );
            }
        }
        let _ = notify_app.emit_to(
            "main",
            "native-ble-disconnected",
            Disconnected {
                session_id: notify_id,
                reason: "Bluetooth notification stream ended".into(),
            },
        );
    });
    let monitor_peripheral = peripheral.clone();
    let monitor_id = session_id.clone();
    let monitor = tauri::async_runtime::spawn(async move {
        loop {
            sleep(Duration::from_secs(2)).await;
            if !matches!(
                timeout(Duration::from_secs(3), monitor_peripheral.is_connected()).await,
                Ok(Ok(true))
            ) {
                let _ = app.emit_to(
                    "main",
                    "native-ble-disconnected",
                    Disconnected {
                        session_id: monitor_id,
                        reason: "Printer switched off or Bluetooth connection lost".into(),
                    },
                );
                break;
            }
        }
    });
    inner.active = Some(Connection {
        peripheral,
        characteristic,
        session_id: session_id.clone(),
        notifications,
        monitor,
    });
    Ok(Session {
        session_id,
        device_name,
    })
}

#[tauri::command]
pub async fn ble_write(
    state: State<'_, BleTransport>,
    session_id: String,
    data: Vec<u8>,
) -> Result<(), String> {
    valid_write(&data)?;
    let mut inner = state.inner.lock().await;
    let connection = inner
        .active
        .as_ref()
        .filter(|c| c.session_id == session_id)
        .ok_or("Printer connection changed or was closed")?;
    let written = timeout(OPERATION_TIMEOUT, async {
        // The printer consumes a framed byte stream, so split at the minimum
        // portable MTU rather than relying on an OS-specific long BLE write.
        for (index, chunk) in data.chunks(WRITE_CHUNK_BYTES).enumerate() {
            if index > 0 {
                sleep(Duration::from_millis(5)).await;
            }
            connection
                .peripheral
                .write(
                    &connection.characteristic,
                    chunk,
                    WriteType::WithoutResponse,
                )
                .await
                .map_err(|e| e.to_string())?;
        }
        Ok::<_, String>(())
    })
    .await;
    match written {
        Ok(Ok(())) => Ok(()),
        failed => {
            // A partial write leaves the printer frame incomplete. Never resume
            // that session with subsequent packets.
            if let Some(connection) = inner.active.take() {
                let _ = close(connection).await;
            }
            Err(match failed {
                Ok(Err(e)) => e,
                _ => "Timed out writing to printer".into(),
            })
        }
    }
}

#[tauri::command]
pub async fn ble_disconnect(
    state: State<'_, BleTransport>,
    session_id: String,
) -> Result<(), String> {
    let mut inner = state.inner.lock().await;
    // A canceled older connection must never close a newer printer session.
    if inner
        .active
        .as_ref()
        .is_some_and(|c| c.session_id == session_id)
    {
        if let Some(connection) = inner.active.take() {
            close(connection).await?;
        }
    }
    Ok(())
}
