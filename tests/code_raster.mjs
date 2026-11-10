/** Small orthogonal vector surface for decode-back tests; no browser/native canvas dependency. */
export class CodeRaster {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4).fill(255);
    this.fillStyle = '#000000';
    this.transform = [1, 1, 0, 0];
    this.stack = [];
    this.paints = [];
    this.texts = [];
  }
  save() { this.stack.push({ transform: [...this.transform], fillStyle: this.fillStyle }); }
  restore() { Object.assign(this, this.stack.pop()); }
  translate(x, y) { this.transform[2] += x * this.transform[0]; this.transform[3] += y * this.transform[1]; }
  scale(x, y) { this.transform[0] *= x; this.transform[1] *= y; }
  point(x, y) { const [sx, sy, tx, ty] = this.transform; return [x * sx + tx, y * sy + ty]; }
  color() {
    const hex = this.fillStyle === 'black' ? '#000000' : this.fillStyle === 'white' ? '#ffffff' : this.fillStyle;
    return hex.slice(1).match(/../g).map((part) => parseInt(part, 16));
  }
  paintSpan(x0, x1, y) {
    if (y < 0 || y >= this.height) return;
    const [r, g, b] = this.color();
    for (let x = Math.max(0, Math.ceil(x0 - .5)); x < Math.min(this.width, Math.ceil(x1 - .5)); x++) {
      const at = (y * this.width + x) * 4;
      this.data[at] = r; this.data[at + 1] = g; this.data[at + 2] = b;
    }
  }
  fillRect(x, y, width, height) {
    this.paints.push(this.fillStyle);
    const [x0, y0] = this.point(x, y), [x1, y1] = this.point(x + width, y + height);
    for (let row = Math.ceil(Math.min(y0, y1) - .5); row < Math.ceil(Math.max(y0, y1) - .5); row++)
      this.paintSpan(Math.min(x0, x1), Math.max(x0, x1), row);
  }
  beginPath() { this.paths = []; }
  moveTo(x, y) { this.paths.push([this.point(x, y)]); }
  lineTo(x, y) { this.paths.at(-1).push(this.point(x, y)); }
  closePath() {}
  fill() {
    this.paints.push(this.fillStyle);
    // Scan nonzero-winding compound polygons, including holes in matrix modules.
    for (let y = 0; y < this.height; y++) {
      const crosses = [];
      for (const path of this.paths) for (let i = 0; i < path.length; i++) {
        const [x0, y0] = path[i], [x1, y1] = path[(i + 1) % path.length];
        if (Math.min(y0, y1) <= y + .5 && Math.max(y0, y1) > y + .5)
          crosses.push([x0 + (x1 - x0) * (y + .5 - y0) / (y1 - y0), y1 > y0 ? 1 : -1]);
      }
      crosses.sort((a, b) => a[0] - b[0]);
      let winding = 0;
      for (let i = 0; i < crosses.length - 1; i++) {
        winding += crosses[i][1];
        if (winding) this.paintSpan(crosses[i][0], crosses[i + 1][0], y);
      }
    }
  }
  measureText() { return { width: 6 }; }
  fillText(text) { this.texts.push(text); } // Captions do not affect the symbol's decoded payload.
}

export function rasterCode(object, draw = (callback) => callback()) {
  const ctx = new CodeRaster(Math.ceil(object.width) + 32, Math.ceil(object.height) + 32);
  ctx.translate(16 + object.width / 2, 16 + object.height / 2);
  draw(() => { object._renderBackground(ctx); object._render(ctx); });
  return ctx;
}
