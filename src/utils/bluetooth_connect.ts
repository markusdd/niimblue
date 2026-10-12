import {
  ConnectEvent,
  ConnectResult,
  DisconnectEvent,
  NiimbotBluetoothClient,
  modelsLibrary,
  type ConnectionInfo,
} from "@mmote/niimbluelib";

/** Niimbot vendor service. Community drivers and niimbluelib use the same UUID. */
const NIIMBOT_SERVICE = "e7810a71-73ae-499d-8c15-faa9aef0c3f2";
/** Notify + write-without-response characteristic on that service. */
const NIIMBOT_CHAR = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f";

const DISCOVERY_SETTLE_MS = 100;
const RETRY_BACKOFF_MS = [0, 400, 800];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Thrown when Chrome drops the ATT link while opening the printer.
 * The connector turns this into a short explanation instead of the raw DOMException.
 */
export class BluetoothLinkDropped extends Error {
  constructor() {
    super("Bluetooth link dropped");
    this.name = "BluetoothLinkDropped";
  }
}

type ConnectOptions = { authorizedDevice?: BluetoothDevice };

interface BleClient {
  disconnect(): Promise<void>;
  getServiceUuidFilter(): string[];
  processRawPacket(data: DataView | Uint8Array): void;
  negotiateAndGetPrinterInfo(cleanup?: () => void): Promise<void>;
  emit(event: "connect", payload: ConnectEvent): boolean;
  emit(event: "disconnect", payload: DisconnectEvent): boolean;
  gattServer?: BluetoothRemoteGATTServer;
  channel?: BluetoothRemoteGATTCharacteristic;
  packetBuf: Uint8Array;
  printerInfo: { connectResult?: ConnectResult };
}

const errorText = (e: unknown): string => (e instanceof Error ? `${e.name}: ${e.message}` : String(e));

const isPermissionError = (e: unknown): boolean => /not allowed to access the service/i.test(errorText(e));

/** Chrome rejects service discovery with these when BlueZ has already torn the link down. */
const isLinkDrop = (e: unknown): boolean => {
  if (isPermissionError(e)) return false;
  if (e instanceof DOMException && (e.name === "NetworkError" || e.name === "InvalidStateError")) return true;
  return /GATT Server is disconnected|GATT Server disconnected/i.test(errorText(e));
};

const nameFilters = (): BluetoothLEScanFilter[] =>
  [...new Set(modelsLibrary.map((model) => model.model[0]))]
    .filter((letter) => letter !== "")
    .map((letter) => ({ namePrefix: letter }));

const openChannel = async (
  server: BluetoothRemoteGATTServer,
  serviceIds: string[],
): Promise<BluetoothRemoteGATTCharacteristic | undefined> => {
  let lastError: unknown;
  for (const uuid of serviceIds) {
    let service: BluetoothRemoteGATTService;
    try {
      service = await server.getPrimaryService(uuid);
    } catch (e) {
      lastError = e;
      if (!server.connected || isLinkDrop(e) || isPermissionError(e)) throw e;
      continue;
    }

    try {
      return await service.getCharacteristic(NIIMBOT_CHAR);
    } catch (e) {
      lastError = e;
      if (!server.connected || isLinkDrop(e)) throw e;
    }

    const characteristics = await service.getCharacteristics();
    const match = characteristics.find((c) => c.properties.notify && c.properties.writeWithoutResponse);
    if (match) return match;
  }
  if (lastError && !server.connected) throw lastError;
  return undefined;
};

/**
 * niimbluelib filters the chooser by the first letter of every model name and then
 * calls getPrimaryServices() with no UUID. A name match does not grant the service,
 * and a full discovery makes BlueZ drop a printer that is already paired to the OS.
 * Grant the known service and read only that one. Retry when the link dies mid-handshake.
 */
const connectPrinter = async function (this: BleClient, options?: ConnectOptions): Promise<ConnectionInfo> {
  await this.disconnect();

  const serviceIds = this.getServiceUuidFilter();
  if (serviceIds.length === 0) serviceIds.push(NIIMBOT_SERVICE);

  let device: BluetoothDevice;
  if (options?.authorizedDevice !== undefined) {
    device = options.authorizedDevice;
  } else {
    device = await navigator.bluetooth.requestDevice({
      filters: [...nameFilters(), { services: serviceIds }],
      optionalServices: serviceIds,
    });
  }

  if (device.gatt === undefined) {
    throw new Error("Device has no Bluetooth Generic Attribute Profile");
  }

  const onValue = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic | null)?.value;
    if (value !== null && value !== undefined) this.processRawPacket(value);
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < RETRY_BACKOFF_MS.length; attempt++) {
    const backoff = RETRY_BACKOFF_MS[attempt] ?? 0;
    if (backoff > 0) await sleep(backoff);

    let server: BluetoothRemoteGATTServer | undefined;
    let channel: BluetoothRemoteGATTCharacteristic | undefined;
    try {
      server = await device.gatt.connect();
      await sleep(DISCOVERY_SETTLE_MS);
      if (!server.connected) {
        throw new DOMException(
          "GATT Server is disconnected. Cannot retrieve services. (Re)connect first with device.gatt.connect.",
          "NetworkError",
        );
      }

      channel = await openChannel(server, serviceIds);
      if (channel === undefined) {
        server.disconnect();
        throw new Error("Suitable device characteristic not found");
      }

      channel.addEventListener("characteristicvaluechanged", onValue);
      await channel.startNotifications();
      this.gattServer = server;
      this.channel = channel;
      await this.negotiateAndGetPrinterInfo(() => {
        void this.disconnect();
      });
      lastError = undefined;
      break;
    } catch (e) {
      lastError = e;
      channel?.removeEventListener("characteristicvaluechanged", onValue);
      try {
        server?.disconnect();
      } catch {
        // The link is already gone.
      }
      this.gattServer = undefined;
      this.channel = undefined;
      this.packetBuf = new Uint8Array();
      if (isPermissionError(e) || !isLinkDrop(e) || attempt === RETRY_BACKOFF_MS.length - 1) break;
    }
  }

  if (lastError !== undefined || this.channel === undefined || this.gattServer === undefined) {
    if (lastError !== undefined && (isLinkDrop(lastError) || isPermissionError(lastError))) {
      console.error("Bluetooth link dropped", lastError);
      throw new BluetoothLinkDropped();
    }
    throw lastError ?? new Error("Unable to connect");
  }

  const disconnectListener = () => {
    this.gattServer = undefined;
    this.channel = undefined;
    this.emit("disconnect", new DisconnectEvent());
    device.removeEventListener("gattserverdisconnected", disconnectListener);
  };
  device.addEventListener("gattserverdisconnected", disconnectListener);

  const result: ConnectionInfo = {
    deviceName: device.name,
    result: this.printerInfo.connectResult ?? ConnectResult.FirmwareErrors,
  };
  this.emit("connect", new ConnectEvent(result));
  return result;
};

let installed = false;

export const installNiimbotBluetoothConnect = (): void => {
  if (installed) return;
  installed = true;
  (NiimbotBluetoothClient.prototype as unknown as { connect: typeof connectPrinter }).connect = connectPrinter;
};
