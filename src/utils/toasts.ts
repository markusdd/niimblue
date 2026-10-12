import Toastify from "toastify-js";
import { z } from "zod";

export class Toasts {
  static error(e: any, duration = 5000) {
    console.error(e);

    Toastify({
      text: `${e}`,
      gravity: "bottom",
      duration,
      className: "toast-danger",
    }).showToast();
  }

  static message(text: string, duration = 5000) {
    Toastify({
      text,
      gravity: "bottom",
      duration,
      className: "toast-info",
    }).showToast();
  }

  static zodErrors(e: any, prefix: string) {
    if (e instanceof z.ZodError) {
      e.issues.forEach((i) => {
        this.error(`${prefix} "${i.path.join("→")}" ${i.message}`);
      });
    }
  }
}
