import * as fabric from "fabric";
import type { ExportedLabelTemplate, LabelProps } from "$/types";

export type UndoState = { undoDisabled: boolean; redoDisabled: boolean };

export class UndoRedo {
  private readonly UNDO_MAX: number = 20;

  private buf: ExportedLabelTemplate[] = [];
  private index: number = 0;

  public paused: boolean = false;

  public onLabelUpdate?: (data: ExportedLabelTemplate) => Promise<void>;
  public onStateUpdate?: (state: UndoState) => void;

  private updateState() {
    this.onStateUpdate?.({
      undoDisabled: this.index === 0,
      redoDisabled: this.index >= this.buf.length - 1,
    });
  }
  async undo() {
    if (this.index <= 0 || this.index >= this.buf.length) {
      this.updateState();
      return;
    }
    // Move first, so a snapshot taken while the canvas reloads branches
    // from the restored step instead of appending past the undone frames.
    this.index--;
    try {
      await this.onLabelUpdate?.(this.buf[this.index]);
    } finally {
      this.updateState();
    }
  }

  async redo() {
    if (this.index >= this.buf.length - 1) {
      this.updateState();
      return;
    }
    this.index++;
    try {
      await this.onLabelUpdate?.(this.buf[this.index]);
    } finally {
      this.updateState();
    }
  }

  push(fabricCanvas: fabric.Canvas, labelProps: LabelProps) {
    if (this.paused) {
      return;
    }

    // A new edit discards the redo tail, including when undo went all the
    // way back to the first snapshot. Leaving that tail made removed frames
    // return on the next undo.
    if (this.index < this.buf.length - 1) {
      this.buf = this.buf.slice(0, this.index + 1);
    }

    this.buf.push({
      label: labelProps,
      canvas: fabricCanvas.toJSON(),
    });

    if (this.buf.length > this.UNDO_MAX) {
      this.buf.shift();
    }

    this.index = this.buf.length - 1;
    this.updateState();
  }
}
