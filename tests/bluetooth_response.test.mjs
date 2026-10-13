import assert from "node:assert/strict";
import test from "node:test";
import {
  NiimbotBluetoothClient, NiimbotPacket, PacketGenerator, PacketReceivedEvent,
  PrintError, ResponseCommandId,
} from "@mmote/niimbluelib";
import { installNiimbotBluetoothResponse } from "../src/utils/bluetooth_response.ts";

installNiimbotBluetoothResponse();

test("page/end ACKs received before the write resolves are retained", async () => {
  for (const packet of [PacketGenerator.pageEnd(), PacketGenerator.printEnd()]) {
    const client = new NiimbotBluetoothClient();
    client.sendPacket = async () => {
      client.emit("packetreceived", new PacketReceivedEvent(new NiimbotPacket(packet.validResponseIds[0], [1])));
      await new Promise((resolve) => setTimeout(resolve, 5));
    };
    const result = await client.sendPacketWaitResponse(packet, 20);
    assert.equal(result.command, packet.validResponseIds[0]);
    assert.equal(client.listenerCount("packetreceived"), 0);
  }
});

test("unrelated notifications are ignored; delayed ACKs resolve", async () => {
  const client = new NiimbotBluetoothClient();
  const packet = PacketGenerator.pageEnd();
  client.sendPacket = async () => {
    client.emit("packetreceived", new PacketReceivedEvent(new NiimbotPacket(ResponseCommandId.In_PrintStatus, [])));
    setTimeout(() => client.emit("packetreceived", new PacketReceivedEvent(new NiimbotPacket(packet.validResponseIds[0], [1]))), 5);
  };
  assert.equal((await client.sendPacketWaitResponse(packet, 20)).command, packet.validResponseIds[0]);
  assert.equal(client.listenerCount("packetreceived"), 0);
});

test("timeout and failed writes release the listener and request lock", async () => {
  const client = new NiimbotBluetoothClient();
  client.sendPacket = async () => {};
  await assert.rejects(client.sendPacketWaitResponse(PacketGenerator.pageEnd(), 5), /waited for e4/);
  assert.equal(client.listenerCount("packetreceived"), 0);
  client.sendPacket = async () => { throw new Error("write failed"); };
  await assert.rejects(client.sendPacketWaitResponse(PacketGenerator.pageEnd(), 5), /write failed/);
  assert.equal(client.listenerCount("packetreceived"), 0);
});

test("early printer errors remain errors and one-way packets need no ACK", async () => {
  const client = new NiimbotBluetoothClient();
  client.sendPacket = async () => {
    client.emit("packetreceived", new PacketReceivedEvent(new NiimbotPacket(ResponseCommandId.In_NotSupported, [0])));
    await new Promise((resolve) => setTimeout(resolve, 5));
  };
  await assert.rejects(client.sendPacketWaitResponse(PacketGenerator.pageEnd(), 20), PrintError);
  assert.equal(client.listenerCount("packetreceived"), 0);
  const packet = PacketGenerator.pageEnd();
  packet.oneWay = true;
  client.sendPacket = async () => {};
  assert.equal((await client.sendPacketWaitResponse(packet, 5)).command, ResponseCommandId.In_Invalid);
});
