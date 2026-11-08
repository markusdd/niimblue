/** Curated fonts embedded in the web build and offline desktop app. */
export const BUNDLED_FONTS = [
  {
    family: "Noto Sans Variable",
    source: "Noto Sans",
    category: "sans",
    license: "OFL-1.1",
    notice: "noto-sans-OFL.txt",
  },
  {
    family: "NiimBlue Serif",
    source: "Noto Serif",
    category: "serif",
    license: "OFL-1.1",
    notice: "noto-serif-OFL.txt",
  },
  {
    family: "NiimBlue Modern",
    source: "Red Hat Display",
    category: "modern",
    license: "OFL-1.1",
    notice: "red-hat-display-OFL.txt",
  },
  {
    family: "NiimBlue Rounded",
    source: "Comfortaa",
    category: "rounded",
    license: "OFL-1.1",
    notice: "comfortaa-OFL.txt",
  },
  {
    family: "NiimBlue Mono",
    source: "Source Code Pro",
    category: "mono",
    license: "OFL-1.1",
    notice: "source-code-pro-OFL.txt",
  },
  {
    family: "NiimBlue Condensed",
    source: "Noto Sans Condensed",
    category: "condensed",
    license: "OFL-1.1",
    notice: "noto-sans-OFL.txt",
  },
  {
    family: "NiimBlue Book",
    source: "Caladea",
    category: "book",
    license: "Apache-2.0",
    notice: "caladea-Apache-2.0.txt",
  },
  {
    family: "NiimBlue Humanist",
    source: "Cantarell",
    category: "humanist",
    license: "OFL-1.1",
    notice: "cantarell-OFL.txt",
  },
] as const;
export type BundledFontFamily = (typeof BUNDLED_FONTS)[number]["family"];
export const BUNDLED_FONT_FAMILIES: string[] = BUNDLED_FONTS.map((font) => font.family);
export const bundledFont = (family: string) => BUNDLED_FONTS.find((font) => font.family === family);

export interface FontRequest {
  family: string;
  style?: string;
  weight?: string | number;
}
const loading = new Map<string, Promise<unknown>>();

/** Load a face before Fabric measures it; each requested style is fetched once. */
export function loadBundledFont({ family, style = "normal", weight = "normal" }: FontRequest): Promise<unknown> {
  if (!bundledFont(family) || typeof document === "undefined" || !document.fonts) return Promise.resolve();
  const css = `${style === "italic" || style === "oblique" ? style : "normal"} ${weight} 16px "${family}"`;
  let pending = loading.get(css);
  if (!pending) {
    // Include Latin and Cyrillic so the existing Noto Sans unicode subsets both load.
    pending = document.fonts.load(css, "AaÄÖÜß0123АБВабв").catch((error) => {
      loading.delete(css);
      throw error;
    });
    loading.set(css, pending);
  }
  return pending;
}

export function loadBundledDesignFonts(): Promise<unknown> {
  return Promise.all([
    loadBundledFont({ family: "Noto Sans Variable" }),
    loadBundledFont({ family: "NiimBlue Serif" }),
    loadBundledFont({ family: "NiimBlue Serif", style: "italic" }),
  ]);
}

/** Font requests include grouped objects and per-character text styles. */
export function bundledFontsInCanvas(value: unknown): FontRequest[] {
  const result = new Map<string, FontRequest>();
  const visit = (value: unknown, inherited: Partial<FontRequest> = {}) => {
    if (!value || typeof value !== "object") return;
    const object = value as {
      fontFamily?: string;
      fontStyle?: string;
      fontWeight?: number | string;
      objects?: unknown[];
      styles?: Record<string, Record<string, unknown>>;
    };
    const request = {
      family: object.fontFamily ?? inherited.family,
      style: object.fontStyle ?? inherited.style,
      weight: object.fontWeight ?? inherited.weight,
    };
    if (request.family && bundledFont(request.family)) result.set(JSON.stringify(request), request as FontRequest);
    if (Array.isArray(object.objects)) object.objects.forEach((child) => visit(child, request));
    if (object.styles && typeof object.styles === "object") {
      for (const row of Object.values(object.styles)) {
        if (row && typeof row === "object") Object.values(row).forEach((character) => visit(character, request));
      }
    }
  };
  visit(value);
  return [...result.values()];
}
export function usesBundledDesignFonts(value: unknown): boolean {
  return bundledFontsInCanvas(value).length > 0;
}
export function loadBundledCanvasFonts(value: unknown): Promise<unknown> {
  return Promise.all(bundledFontsInCanvas(value).map(loadBundledFont));
}
