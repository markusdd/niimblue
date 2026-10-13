import { spawnSync } from "node:child_process";
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const explicitBundles = args.some((arg) => arg === "-b" || arg === "--bundles" || arg.startsWith("--bundles=") || arg === "--no-bundle");
if (!explicitBundles) {
  if (process.platform === "win32") {
    console.log("Building standalone Windows executable (use --bundles nsis for an installer).");
    args.push("--no-bundle");
  } else {
    const bundle = process.platform === "linux" ? "appimage" : "dmg";
    console.log(`Building ${bundle} package (override with --bundles).`);
    args.push("--bundles", bundle);
  }
}

const result = spawnSync(process.execPath, [fileURLToPath(new URL("node_modules/@tauri-apps/cli/tauri.js", import.meta.url)), "build", ...args], {
  cwd: fileURLToPath(new URL("./", import.meta.url)),
  stdio: "inherit",
  // linuxdeploy is itself an AppImage. Extraction avoids requiring FUSE to build.
  env: {
    ...process.env,
    APPIMAGE_EXTRACT_AND_RUN: process.env.APPIMAGE_EXTRACT_AND_RUN ?? "1",
    // linuxdeploy's bundled strip predates RELR sections used by modern libraries.
    NO_STRIP: process.env.NO_STRIP ?? "1",
  },
});
if (result.error) console.error(result.error.message);
if (result.status === 0 && process.platform === "win32") {
  // Publish a friendly filename without changing the Rust crate/binary name.
  // Explicit cross-compilation and debug builds retain Tauri's own output path.
  const customTarget = args.some((arg) => arg === "--target" || arg.startsWith("--target="));
  if (!customTarget && !args.includes("--debug")) {
    copyFileSync(new URL("src-tauri/target/release/niimblues.exe", import.meta.url), new URL("src-tauri/target/release/NiimBlue.exe", import.meta.url));
    console.log("Standalone app: src-tauri/target/release/NiimBlue.exe");
  }
}
process.exit(result.status ?? 1);
