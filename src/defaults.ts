import * as fabric from "fabric";
import type { AppConfig, LabelPreset, LabelProps } from "$/types";
import { TextboxExt } from "$/fabric-object/textbox-ext";
import { mmToPx } from "$/utils/label_units";

export const configureFabric = () => {
  fabric.config.disableStyleCopyPaste = true;
  for (const key of ["layoutScale", "perPixelTargetFind", "layerInfo"]) {
    if (!fabric.FabricObject.customProperties.includes(key)) {
      fabric.FabricObject.customProperties.push(key);
    }
  }

  fabric.classRegistry.setClass(TextboxExt, "Textbox");

  fabric.Line.prototype.setControlsVisibility({
    tl: false,
    bl: false,
    tr: false,
    br: false,
    mt: false,
    mb: false,
  });

  fabric.Polyline.prototype.setControlsVisibility({
    tl: false,
    bl: false,
    tr: false,
    br: false,
    mt: false,
    mb: false,
  });
};

/** Default presets for LabelPropsEditor. Sizes are millimetres, not a printer density. */
export const DEFAULT_LABEL_PRESETS: LabelPreset[] = [
  { width: 40, height: 12, unit: "mm", printDirection: "left", shape: "rect" },
  { width: 50, height: 30, unit: "mm", printDirection: "top", shape: "rect" },
];

/** Default canvas. 40×12 mm at the editor's fixed design raster. */
export const DEFAULT_LABEL_PROPS: LabelProps = {
  printDirection: "left",
  shape: "rect",
  size: {
    width: mmToPx(40),
    height: mmToPx(12),
  },
};

/** Object movement snapping */
export const GRID_SIZE: number = 5;

/** Newly created Fabric object dimensions */
export const OBJECT_SIZE_DEFAULTS = {
  width: 64,
  height: 64,
};

/** Newly created Fabric object common properties */
export const OBJECT_DEFAULTS = {
  snapAngle: 10,
  top: 10,
  left: 10,
  originX: "left" as fabric.TOriginX,
  originY: "top" as fabric.TOriginY,
} as fabric.FabricObjectProps;

/** Newly created Fabric vector object properties */
export const OBJECT_DEFAULTS_VECTOR = {
  ...OBJECT_DEFAULTS,
  fill: "transparent",
  stroke: "black",
  strokeWidth: 3,
  strokeUniform: true,
} as fabric.FabricObjectProps;

/** Newly created Fabric text object properties */
export const OBJECT_DEFAULTS_TEXT = {
  ...OBJECT_DEFAULTS,
  fill: "black",
  fontFamily: "Noto Sans Variable",
  textAlign: "center" as fabric.TextboxProps["textAlign"],
  originX: "center" as fabric.TOriginX,
  originY: "center" as fabric.TOriginY,
  lineHeight: 1,
} as fabric.TextboxProps;

/** Scale image to this height when making a label thumbnail */
export const THUMBNAIL_HEIGHT = 48;

/** Generate thumbnail in jpeg format with this quality */
export const THUMBNAIL_QUALITY = 0.7;

export const APP_CONFIG_DEFAULTS: AppConfig = {
  fitMode: "stretch",
  iconListMode: "both",
  gridEnabled: false
};

export const CSV_DEFAULT = "var1,var2\n123,456\n777,888";
