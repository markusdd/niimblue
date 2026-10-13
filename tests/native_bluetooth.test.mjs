import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";
import { NiimbotPacket, PacketGenerator } from "@mmote/niimbluelib";

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier) && context.parentURL?.endsWith(".ts")) {
    return next(`${specifier}.ts`, context);
  }
  return next(specifier, context);
} });
const { NiimbotNativeBluetoothClient, hasNativeBluetooth } = await import("../src/utils/native_bluetooth.ts");

class Bridge {
  handlers = new Map();
  calls = [];
  session = 0;
  acknowledge = true;
  writeError;
  async listen(event, handler) {
    const handlers = this.handlers.get(event) ?? new Set();
    handlers.add(handler); this.handlers.set(event, handlers);
    return () => handlers.delete(handler);
  }
  emit(event, payload) { for (const handler of this.handlers.get(event) ?? []) handler({ payload }); }
  async invoke(command, args) {
    this.calls.push({ command, args });
    if (command === "ble_scan") return [{ id: "printer", name: "M2-H", rssi: -40 }];
    if (command === "ble_connect") {
      if (this.open) return this.open();
      return { sessionId: `session-${++this.session}`, deviceName: "M2-H" };
    }
    if (command === "ble_write") {
      if (this.writeError) throw this.writeError;
      this.onWrite?.();
      if (this.acknowledge) {
        const response = new NiimbotPacket(PacketGenerator.pageEnd().validResponseIds[0], [1]).toBytes();
        // Fragmented notifications arriving during the native write.
        for (const data of [response.slice(0, 3), response.slice(3)]) {
          this.emit("native-ble-data", { sessionId: args.sessionId, data: Array.from(data) });
        }
      }
    }
  }
  get listenerCount() { return [...this.handlers.values()].reduce((count, handlers) => count + handlers.size, 0); }
}

class Client extends NiimbotNativeBluetoothClient {
  constructor(bridge) { super(bridge); this.setHeartbeatAutoStart(false); this.setPacketInterval(0); }
  async negotiateAndGetPrinterInfo() { if (this.handshakeError) throw this.handshakeError; }
}

test("normal browser does not claim native Bluetooth", () => { assert.equal(hasNativeBluetooth(), false); });

test("discovery and early fragmented responses use the native transport", async () => {
  const bridge = new Bridge(), client = new Client(bridge);
  assert.equal((await client.scan())[0].name, "M2-H");
  assert.equal((await client.connect({ deviceId: "printer" })).deviceName, "M2-H");
  const response = await client.sendPacketWaitResponse(PacketGenerator.pageEnd(), 50);
  assert.equal(response.command, PacketGenerator.pageEnd().validResponseIds[0]);
  assert.equal(client.listenerCount("packetreceived"), 0);
  await client.disconnect();
  assert.equal(client.isConnected(), false);
  assert.equal(bridge.listenerCount, 0);
  assert.ok(bridge.calls.some(({ command, args }) => command === "ble_disconnect" && args.sessionId === "session-1"));
});

test("stale notifications and disconnects cannot affect a new connection", async () => {
  const bridge = new Bridge(), client = new Client(bridge);
  await client.connect({ deviceId: "printer" });
  await client.connect({ deviceId: "printer" });
  bridge.emit("native-ble-disconnected", { sessionId: "session-1", reason: "old link closed" });
  let packets = 0; client.on("packetreceived", () => packets++);
  bridge.emit("native-ble-data", { sessionId: "session-1", data: Array.from(new NiimbotPacket(0xe4, [1]).toBytes()) });
  assert.equal(packets, 0);
  assert.equal(client.isConnected(), true);
  await client.sendPacketWaitResponse(PacketGenerator.pageEnd(), 50);
  assert.equal(packets, 1);
  await client.disconnect();
});

test("canceling a pending connection cleans up the session returned later", async () => {
  const bridge = new Bridge(), client = new Client(bridge);
  let opened, connecting;
  const started = new Promise((resolve) => { connecting = resolve; });
  bridge.open = () => new Promise((resolve) => { opened = resolve; connecting(); });
  let connects = 0; client.on("connect", () => connects++);
  const pending = assert.rejects(client.connect({ deviceId: "printer" }), /canceled/);
  await started;
  await client.disconnect();
  opened({ sessionId: "late-session", deviceName: "M2-H" });
  await pending;
  assert.equal(connects, 0);
  assert.equal(bridge.listenerCount, 0);
  assert.ok(bridge.calls.some(({ command, args }) => command === "ble_disconnect" && args.sessionId === "late-session"));
});

test("failed handshake disconnects and unregisters notifications", async () => {
  const bridge = new Bridge(), client = new Client(bridge);
  client.handshakeError = new Error("negotiation failed");
  await assert.rejects(client.connect({ deviceId: "printer" }), /negotiation failed/);
  assert.equal(client.isConnected(), false);
  assert.equal(bridge.listenerCount, 0);
  assert.equal(bridge.calls.filter(({ command }) => command === "ble_disconnect").length, 1);
});

test("connection loss rejects an outstanding response and cleans the link", async () => {
  const bridge = new Bridge(), client = new Client(bridge);
  await client.connect({ deviceId: "printer" });
  bridge.acknowledge = false;
  let wrote; const writing = new Promise((resolve) => { wrote = resolve; }); bridge.onWrite = wrote;
  const pending = assert.rejects(client.sendPacketWaitResponse(PacketGenerator.pageEnd(), 1000), /disconnected/);
  await writing;
  bridge.emit("native-ble-disconnected", { sessionId: "session-1", reason: "power off" });
  await pending;
  assert.equal(client.isConnected(), false);
  assert.equal(client.listenerCount("packetreceived"), 0);
  assert.equal(bridge.listenerCount, 0);
});

test("partial write failure invalidates the client instead of reusing the byte stream", async () => {
  const bridge = new Bridge(), client = new Client(bridge);
  await client.connect({ deviceId: "printer" });
  bridge.writeError = new Error("write failed");
  await assert.rejects(client.sendPacketWaitResponse(PacketGenerator.pageEnd(), 50), /write failed/);
  assert.equal(client.isConnected(), false);
  assert.equal(bridge.listenerCount, 0);
  assert.ok(bridge.calls.some(({ command, args }) => command === "ble_disconnect" && args.sessionId === "session-1"));
});
