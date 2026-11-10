import { util } from "fabric";
import { MatrixCode, type MatrixEncoding } from "$/fabric-object/matrixcode";
import type { QRCode } from "$/fabric-object/qrcode";

/** Convert only when a legacy QR changes format; enliven its paints and metadata too. */
export async function convertLegacyQRCode(source: QRCode, encoding: MatrixEncoding): Promise<MatrixCode> {
  const [code] = await util.enlivenObjects<MatrixCode>([
    { ...source.toObject(), type: MatrixCode.type, encoding: "QRCODE" },
  ]);
  code.setEncoding(encoding);
  return code;
}
