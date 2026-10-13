/** Fit artwork across the printhead, retaining its proportions and feed length. */
export function printFit(width: number, height: number, acrossWidth: boolean, headPixels?: number) {
  const across = acrossWidth ? width : height;
  const scale = headPixels !== undefined && headPixels > 0 ? Math.min(1, headPixels / across) : 1;
  const drawWidth = Math.max(1, Math.round(width * scale));
  const drawHeight = Math.max(1, Math.round(height * scale));
  const outputWidth = acrossWidth ? drawWidth : width;
  const outputHeight = acrossWidth ? height : drawHeight;
  return {
    scale,
    width: outputWidth,
    height: outputHeight,
    drawWidth,
    drawHeight,
    x: Math.floor((outputWidth - drawWidth) / 2),
    y: Math.floor((outputHeight - drawHeight) / 2),
  };
}
