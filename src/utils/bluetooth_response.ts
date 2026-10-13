import {
  NiimbotBluetoothClient,
  NiimbotPacket,
  PrintError,
  PrinterErrorCode,
  RequestCommandId,
  ResponseCommandId,
  Utils,
  Validators,
  type PacketReceivedEvent,
} from "@mmote/niimbluelib";

/** niimbluelib 0.47 waits after writing, losing notifications during the write. */
class ReliableBluetoothClient extends NiimbotBluetoothClient {
  override async sendPacketWaitResponse(packet: NiimbotPacket, timeoutMs = 1000): Promise<NiimbotPacket> {
    return this.mutex.runExclusive(async () => {
      if (packet.oneWay) {
        await this.sendPacket(packet, true);
        return new NiimbotPacket(ResponseCommandId.In_Invalid, []);
      }

      let timer: ReturnType<typeof setTimeout> | undefined;
      let listener: (event: PacketReceivedEvent) => void = () => {};
      let received = false;
      const started = performance.now();
      let rejectResponse: (reason: unknown) => void = () => {};
      const response = new Promise<NiimbotPacket>((resolve, reject) => {
        rejectResponse = reject;
        listener = ({ packet: incoming }) => {
          if (received) return;
          const command = incoming.command;
          if (packet.validResponseIds.length > 0 && !packet.validResponseIds.includes(command as ResponseCommandId) &&
              command !== ResponseCommandId.In_PrintError && command !== ResponseCommandId.In_NotSupported) return;
          received = true;
          try {
            if (command === ResponseCommandId.In_PrintError) {
              Validators.arrayLengthEquals(incoming.data, 1);
              const reason = incoming.data[0];
              reject(new PrintError(`Print error ${reason}: ${PrinterErrorCode[reason] ?? "unknown"}`, reason));
            } else if (command === ResponseCommandId.In_NotSupported) {
              reject(new PrintError("Feature not supported", 0));
            } else {
              if (packet.command === RequestCommandId.PageEnd) {
                console.log(`PageEnd acknowledged after ${Math.round(performance.now() - started)} ms`);
              }
              resolve(incoming);
            }
          } catch (error) {
            reject(error);
          }
        };
        this.on("packetreceived", listener);
      });
      // An error notification may arrive before sendPacket resolves.
      void response.catch(() => {});
      try {
        await this.sendPacket(packet, true);
        if (!received) {
          timer = setTimeout(() => rejectResponse(new Error(
            `Timeout waiting response (waited for ${Utils.bufToHex(packet.validResponseIds, ", ")})`,
          )), timeoutMs ?? 1000);
        }
        return await response;
      } finally {
        clearTimeout(timer);
        this.off("packetreceived", listener);
      }
    });
  }
}

export function installNiimbotBluetoothResponse(): void {
  NiimbotBluetoothClient.prototype.sendPacketWaitResponse = ReliableBluetoothClient.prototype.sendPacketWaitResponse;
}
