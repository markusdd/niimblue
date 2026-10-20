import type { LabelPanel, LabelProps } from "$/types";

/** Regions are normalized to the whole carrier so saved templates stay DPI-independent. */
export function panelBoxes(props: Pick<LabelProps, "size" | "panels" | "shape">) {
  return (props.panels ?? []).map((panel) => ({
    left: panel.left * props.size.width,
    top: panel.top * props.size.height,
    width: panel.width * props.size.width,
    height: panel.height * props.size.height,
    shape: panel.shape ?? props.shape ?? "rect",
  }));
}

export function turnPanels(panels: LabelPanel[] | undefined): LabelPanel[] | undefined {
  return panels?.map((panel) => ({
    ...panel,
    left: Math.max(0, 1 - panel.top - panel.height),
    top: panel.left,
    width: panel.height,
    height: panel.width,
  }));
}
