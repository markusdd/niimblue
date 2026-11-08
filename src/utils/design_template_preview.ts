import type { DesignScene } from "../data/design_templates";

import { designTextSize, designFontFamily } from "./design_typography";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!,
  );

/** Trusted inline SVG from original, bundled artwork; text is always escaped. */
export function designPreviewSvg(scene: DesignScene): string {
  const { width: w, height: h, elements } = scene;
  const round = scene.shape === "circle";
  const paper = round
    ? `<circle cx="${w / 2}" cy="${h / 2}" r="${w / 2}" fill="white"/>`
    : `<rect width="${w}" height="${h}" rx="${scene.shape === "rounded_rect" ? 2 : 0}" fill="white"/>`;
  const content = elements
    .map((element) => {
      if (element.kind === "text") {
        const lines = element.text.split("\n");
        const size = designTextSize(element);
        return `<text x="${element.x + element.width / 2}" y="${element.y + size}" text-anchor="middle" font-family="${escape(designFontFamily(element))}" font-size="${size}" font-weight="${element.weight ?? 400}" font-style="${element.italic ? "italic" : "normal"}" letter-spacing="${((element.spacing ?? 0) / 1000) * size}" fill="black">${lines.map((line, index) => `<tspan x="${element.x + element.width / 2}" dy="${index ? size * 1.16 : 0}">${escape(line)}</tspan>`).join("")}</text>`;
      }
      const view = element.svg
        .match(/viewBox="([^"]+)"/)?.[1]
        .split(/\s+/)
        .map(Number) ?? [0, 0, element.width, element.height];
      const body = element.svg.replace(/<svg\b[^>]*>/, "").replace(/<\/svg>\s*$/, "");
      // Preserve root styles from the ornament when moving its geometry into this SVG.
      const attrs =
        element.svg.match(/<svg\b([^>]*)>/)?.[1].replace(/\s+(xmlns|viewBox|width|height)="[^"]*"/g, "") ?? "";
      return `<g transform="translate(${element.x + (element.flipX ? element.width : 0)} ${element.y + (element.flipY ? element.height : 0)}) scale(${((element.flipX ? -1 : 1) * element.width) / view[2]} ${((element.flipY ? -1 : 1) * element.height) / view[3]})"><g ${attrs}>${body}</g></g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false">${paper}${content}</svg>`;
}
