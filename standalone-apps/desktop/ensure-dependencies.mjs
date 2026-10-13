import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("./", import.meta.url));
const executable = new URL(`node_modules/.bin/tauri${process.platform === "win32" ? ".cmd" : ""}`, import.meta.url);

if (!existsSync(executable)) {
  console.log("Installing desktop build dependencies (Tauri CLI)…");
  // npm supplies its CLI path to lifecycle scripts on every supported platform.
  const result = spawnSync(process.execPath, [process.env.npm_execpath, "ci", "--include=dev"], {
    cwd: directory,
    stdio: "inherit",
  });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}
