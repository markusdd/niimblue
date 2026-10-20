import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Plugin } from "vite";
import { normalizeFontFamilies } from "../src/utils/font_names";

const exec = promisify(execFile);
type Run = (file: string, args: string[]) => Promise<string>;
const runCommand: Run = async (file, args) =>
  (
    await exec(file, args, {
      encoding: "utf8",
      windowsHide: true,
      timeout: 30_000,
      maxBuffer: 4 * 1024 * 1024,
    })
  ).stdout;

/** Development host only. Production desktop discovery lives in Rust. */
export async function enumerateSystemFonts(
  platform: NodeJS.Platform = process.platform,
  run: Run = runCommand,
): Promise<string[]> {
  let names: unknown[];
  if (platform === "linux") {
    const output = await run("fc-list", ["--format", "%{family}\\n"]);
    names = output.split(/\r?\n/).flatMap((line) => line.split(","));
  } else if (platform === "win32") {
    const output = await run("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); Add-Type -AssemblyName System.Drawing; $fonts = New-Object System.Drawing.Text.InstalledFontCollection; try { @($fonts.Families | ForEach-Object { $_.Name }) | ConvertTo-Json -Compress } finally { $fonts.Dispose() }",
    ]);
    const parsed: unknown = JSON.parse(output.replace(/^\uFEFF/, ""));
    names = Array.isArray(parsed) ? parsed : [parsed];
  } else if (platform === "darwin") {
    const output = await run("/usr/bin/osascript", [
      "-l",
      "JavaScript",
      "-e",
      "ObjC.import('AppKit'); JSON.stringify(ObjC.deepUnwrap($.NSFontManager.sharedFontManager.availableFontFamilies));",
    ]);
    const parsed: unknown = JSON.parse(output);
    names = Array.isArray(parsed) ? parsed : [];
  } else throw new Error("System font discovery is not available on this development host");
  return normalizeFontFamilies(names);
}

export function localFontRequestAllowed(
  host: string | undefined,
  origin: string | undefined,
  address: string | undefined,
): boolean {
  if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address ?? "")) return false;
  try {
    const base = new URL(`http://${host ?? ""}`);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) return false;
    return !origin || new URL(origin).host === base.host;
  } catch {
    return false;
  }
}

export function systemFontsPlugin(): Plugin {
  return {
    name: "niimblue-local-system-fonts",
    apply: "serve",
    configureServer(server) {
      let pending: Promise<string[]> | undefined;
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== "/__niimblue/system-fonts") return next();
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        if (request.method !== "GET") {
          response.statusCode = 405;
          response.setHeader("Allow", "GET");
          response.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        if (
          request.headers["sec-fetch-site"] === "cross-site" ||
          !localFontRequestAllowed(request.headers.host, request.headers.origin, request.socket.remoteAddress)
        ) {
          response.statusCode = 403;
          response.end(JSON.stringify({ error: "Font discovery is only available from localhost" }));
          return;
        }
        pending ??= enumerateSystemFonts().finally(() => {
          pending = undefined;
        });
        void pending
          .then((families) => response.end(JSON.stringify({ families })))
          .catch((error) => {
            server.config.logger.warn(`System font discovery failed: ${String(error)}`);
            response.statusCode = 500;
            response.end(JSON.stringify({ error: "Could not list installed fonts" }));
          });
      });
    },
  };
}
