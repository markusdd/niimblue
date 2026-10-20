import type { FabricObject } from "fabric";

export interface LayerInfo {
  kind: "frame" | "clipart" | "icon" | "image" | "illustration";
  name?: string;
}

export type NamedLayer = FabricObject & { layerInfo?: LayerInfo };

export function nameLayer<T extends FabricObject>(object: T, info: LayerInfo): T {
  (object as NamedLayer).layerInfo = info;
  return object;
}

export function readableLayerDetail(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}
