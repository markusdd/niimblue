import { normalizeFontFamilies } from "./font_names";

export interface FontEnvironment {
  nativeInvoke?: (command: string) => Promise<unknown>;
  query?: () => Promise<readonly { family: string }[]>;
  dev?: boolean;
  fetch?: typeof fetch;
}

export interface SystemFonts {
  source: "desktop" | "browser" | "dev";
  families: string[];
}

function environment(): FontEnvironment {
  const desktop =
    typeof window === "undefined"
      ? undefined
      : (
          window as Window & {
            __TAURI__?: { core?: { invoke: (command: string) => Promise<unknown> } };
          }
        ).__TAURI__?.core;
  return {
    nativeInvoke: desktop?.invoke,
    query: typeof queryLocalFonts === "function" ? () => queryLocalFonts() : undefined,
    dev: import.meta.env?.DEV ?? false,
    fetch: globalThis.fetch,
  };
}

export function canDiscoverSystemFonts(env = environment()): boolean {
  return !!(env.nativeInvoke || env.query || env.dev);
}

/** Browser enumeration must run in the click handler that grants permission. */
export async function discoverSystemFonts(interactive: boolean, env = environment()): Promise<SystemFonts | undefined> {
  let source: SystemFonts["source"];
  let names: unknown;
  if (env.nativeInvoke) {
    source = "desktop";
    names = await env.nativeInvoke("list_system_fonts");
  } else if (interactive && env.query) {
    source = "browser";
    names = (await env.query()).map((font) => font.family);
  } else if (env.dev && env.fetch) {
    source = "dev";
    const response = await env.fetch("/__niimblue/system-fonts", { credentials: "same-origin" });
    if (!response.ok) throw new Error("Could not list installed fonts");
    names = ((await response.json()) as { families?: unknown }).families;
  } else return undefined;
  if (!Array.isArray(names)) throw new Error("Invalid font list");
  return { source, families: normalizeFontFamilies(names) };
}

let automatic: Promise<SystemFonts | undefined> | undefined;
export function automaticSystemFonts(): Promise<SystemFonts | undefined> {
  automatic ??= discoverSystemFonts(false).catch((error) => {
    automatic = undefined;
    throw error;
  });
  return automatic;
}

export async function refreshSystemFonts(): Promise<SystemFonts | undefined> {
  const result = await discoverSystemFonts(true);
  if (result) automatic = Promise.resolve(result);
  return result;
}
