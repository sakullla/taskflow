import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const backupScript = resolve(scriptDir, "backup.sh");
const cwd = resolve(scriptDir, "..");

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

if (process.platform === "win32") {
  const gitBash = "C:\\Program Files\\Git\\bin\\bash.exe";
  if (existsSync(gitBash)) {
    run(gitBash, [backupScript]);
  }

  run("bash", [backupScript]);
}

run("bash", [backupScript]);
