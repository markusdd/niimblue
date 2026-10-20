mod ble_policy;
mod bluetooth;
mod fonts;
#[cfg(target_os = "windows")]
mod windows_runtime;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    if !windows_runtime::ensure_available() {
        return;
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(bluetooth::BleTransport::default())
        .invoke_handler(tauri::generate_handler![
            bluetooth::ble_scan,
            bluetooth::ble_connect,
            bluetooth::ble_write,
            bluetooth::ble_disconnect,
            fonts::list_system_fonts,
        ])
        .build(tauri::generate_context!())
        .expect("error while building desktop application")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested {
                api, code: None, ..
            } = event
            {
                api.prevent_exit();
                let transport = app.state::<bluetooth::BleTransport>().inner().clone();
                let handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    transport.shutdown().await;
                    handle.exit(0);
                });
            }
        });
}
