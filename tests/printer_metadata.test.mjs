import assert from "node:assert/strict";
import test from "node:test";
import { getPrinterMetaById, PacketParser, NiimbotPacket } from "@mmote/niimbluelib";
import { reportedPrinterMetadata } from "../src/utils/printer_metadata.ts";
import { printFit } from "../src/utils/print_fit.ts";

test("M2 reported width overrides the model table without mutating it", () => {
  const meta = getPrinterMetaById(4608);
  const packet = NiimbotPacket.fromHex("55 55 bf 5a 01 01 1f 02 01 02 03 01 00 04 02 01 2c 05 01 03 06 02 04 00 07 02 05 01 08 02 05 01 09 04 00 00 02 13 0a 02 02 40 0b 02 0e 10 0c 01 01 0d 01 02 0e 01 01 0f 01 03 10 01 07 11 02 04 00 12 01 00 13 02 00 00 14 01 03 15 01 00 16 01 00 17 01 00 18 05 00 00 00 00 00 19 01 01 9e aa aa");
  const capabilities = PacketParser.parsePrinterCapabilities(packet);
  assert.equal(capabilities.printheadWidth, 576);
  const actual = reportedPrinterMetadata(meta, { capabilities });
  assert.equal(actual.printheadPixels, 576);
  assert.equal(meta.printheadPixels, 567);
  const fitted = printFit(591, 354, true, actual.printheadPixels);
  assert.equal(fitted.width, 576);
  assert.equal(fitted.height, 354);
});

test("missing or invalid reported widths keep the model fallback", () => {
  const meta = getPrinterMetaById(4608);
  for (const width of [undefined, 0, -1, NaN, 12.5]) {
    assert.equal(reportedPrinterMetadata(meta, { capabilities: { printheadWidth: width } }), meta);
  }
  assert.equal(reportedPrinterMetadata(undefined, { capabilities: { printheadWidth: 576 } }), undefined);
});
