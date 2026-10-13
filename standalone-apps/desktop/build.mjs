import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const explicitBundles = args.some((arg) => arg === "-b" || arg === "--bundles" || arg.startsWith("--bundles=") || arg === "--no-bundle");
if (!explicitBundles) {
  const bundle = process.platform === "linux" ? "appimage" : process.platform === "win32" ? "nsis" : "dmg";
  console.log(`Building ${bundle} installer (override with --bundles).`);
  args.push("--bundles", bundle);
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
process.exit(result.status ?? 1);
