import { NiimbotAbstractClient, type PrinterModelMeta, type PrinterInfo } from "@mmote/niimbluelib";

export function reportedPrinterMetadata(meta: PrinterModelMeta | undefined, info: PrinterInfo): PrinterModelMeta | undefined {
  if (meta === undefined) return undefined;
  const width = info.capabilities?.printheadWidth;
  return width !== undefined && Number.isInteger(width) && width > 0
    ? { ...meta, printheadPixels: width }
    : meta;
}

let installed = false;

/** Use the same width for preview fitting and the library's bitmap pixel counts. */
export function installReportedPrinterMetadata(): void {
  if (installed) return;
  installed = true;
  const original = NiimbotAbstractClient.prototype.getModelMetadata;
  NiimbotAbstractClient.prototype.getModelMetadata = function () {
    return reportedPrinterMetadata(original.call(this), this.getPrinterInfo());
  };
}
