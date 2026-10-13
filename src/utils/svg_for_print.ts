/** Resolve inherited paint explicitly because Fabric can lose SVG group fills. */
export function svgForPrint(svg: string): string {
  const document = new DOMParser().parseFromString(svg.replaceAll("currentColor", "#000"), "image/svg+xml");
  if (document.querySelector("parsererror")) throw new Error("Invalid icon SVG");
  const inherited = (element: Element, name: string): string | undefined => {
    for (let node: Element | null = element; node; node = node.parentElement) {
      if (node.hasAttribute(name)) return node.getAttribute(name)!;
    }
    return undefined;
  };
  for (const element of document.querySelectorAll("path, circle, rect, polygon, ellipse, polyline, line")) {
    element.setAttribute("fill", inherited(element, "fill") ?? "#000");
    for (const attribute of ["stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-rule", "clip-rule"]) {
      const value = inherited(element, attribute);
      if (value !== undefined) element.setAttribute(attribute, value);
    }
  }
  return new XMLSerializer().serializeToString(document.documentElement);
}
