import {
  ConnectEvent, ConnectResult, DisconnectEvent, RawPacketSentEvent, Utils,
  type ConnectionInfo, type NiimbotClientType,
} from "@mmote/niimbluelib";
import { ReliablePacketClient } from "./bluetooth_response";

export interface NativePrinter { id: string; name: string; rssi?: number }
interface NativeSession { sessionId: string; deviceName: string }
interface NativeData { sessionId: string; data: number[] }
interface NativeDisconnect { sessionId: string; reason: string }

export interface NativeBridge {
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
  listen<T>(event: string, handler: (event: { payload: T }) => void): Promise<() => void>;
}

type TauriWindow = Window & { __TAURI__?: { core: Pick<NativeBridge, "invoke">; event: Pick<NativeBridge, "listen"> } };

export const hasNativeBluetooth = (): boolean =>
  typeof window !== "undefined" && !!(window as TauriWindow).__TAURI__?.core?.invoke;

function nativeBridge(): NativeBridge {
  const tauri = (window as TauriWindow).__TAURI__;
  if (!tauri) throw new Error("Native Bluetooth requires the NiimBlue desktop app");
  return { invoke: tauri.core.invoke, listen: tauri.event.listen };
}

/** Keep niimbluelib's printer protocol; only the byte transport runs in Rust. */
export class NiimbotNativeBluetoothClient extends ReliablePacketClient {
  private sessionId?: string;
  private generation = 0;
  private unlisten: Array<() => void> = [];
  private readonly bridge: NativeBridge;

  constructor(bridge: NativeBridge = nativeBridge()) { super(); this.bridge = bridge; }

  scan(): Promise<NativePrinter[]> { return this.bridge.invoke("ble_scan"); }

  override async connect(options?: { deviceId: string }): Promise<ConnectionInfo> {
    if (!options?.deviceId) throw new Error("Choose a printer first");
    await this.disconnect();
    const generation = this.generation;
    const ensureCurrent = () => {
      if (this.generation !== generation) throw new Error("Connection canceled");
    };
    const registrations: Array<() => void> = [];
    const once = (unlisten: () => void) => {
      let removed = false;
      return () => { if (!removed) { removed = true; unlisten(); } };
    };
    let opened: NativeSession | undefined;
    try {
      // Register callbacks before Rust can deliver any printer notifications.
      registrations.push(once(await this.bridge.listen<NativeData>("native-ble-data", ({ payload }) => {
        if (payload.sessionId === this.sessionId) this.processRawPacket(new Uint8Array(payload.data));
      })));
      ensureCurrent();
      registrations.push(once(await this.bridge.listen<NativeDisconnect>("native-ble-disconnected", ({ payload }) => {
        if (payload.sessionId !== this.sessionId) return;
        console.warn("Printer disconnected", payload.reason);
        void this.disconnect().catch((error) => console.warn("Bluetooth cleanup failed", error));
      })));
      ensureCurrent();
      this.unlisten = registrations;
      opened = await this.bridge.invoke<NativeSession>("ble_connect", { deviceId: options.deviceId });
      ensureCurrent();
      this.sessionId = opened.sessionId;
      await this.negotiateAndGetPrinterInfo();
      ensureCurrent();
      const info: ConnectionInfo = {
        deviceName: opened.deviceName,
        result: this.printerInfo.connectResult ?? ConnectResult.FirmwareErrors,
      };
      this.emit("connect", new ConnectEvent(info));
      return info;
    } catch (error) {
      for (const unlisten of registrations) unlisten();
      if (opened) {
        await this.bridge.invoke("ble_disconnect", { sessionId: opened.sessionId }).catch(() => {});
      }
      if (this.generation === generation) this.clearConnection();
      throw error;
    }
  }

  private clearConnection(): void {
    const hadSession = this.sessionId !== undefined;
    this.generation++;
    this.sessionId = undefined;
    this.stopHeartbeat();
    this.protocol.cancelStatusPoll();
    for (const unlisten of this.unlisten) unlisten();
    this.unlisten = [];
    if (hadSession) this.emit("disconnect", new DisconnectEvent());
  }

  override isConnected(): boolean { return this.sessionId !== undefined; }

  override async disconnect(): Promise<void> {
    const sessionId = this.sessionId;
    this.clearConnection();
    if (sessionId) await this.bridge.invoke("ble_disconnect", { sessionId });
  }

  override async sendRaw(data: Uint8Array, force = false): Promise<void> {
    const write = async () => {
      const sessionId = this.sessionId;
      if (!sessionId) throw new Error("Printer is disconnected");
      await Utils.sleep(this.packetIntervalMs);
      if (sessionId !== this.sessionId) throw new Error("Printer connection changed");
      try {
        await this.bridge.invoke("ble_write", { sessionId, data: Array.from(data) });
      } catch (error) {
        if (sessionId === this.sessionId) {
          this.clearConnection();
          await this.bridge.invoke("ble_disconnect", { sessionId }).catch(() => {});
        }
        throw error;
      }
      this.emit("rawpacketsent", new RawPacketSentEvent(data));
    };
    if (force) await write();
    else await this.mutex.runExclusive(write);
  }

  // Preserve the existing transport preference and UI terminology.
  override getType(): NiimbotClientType { return "bluetooth"; }
}
