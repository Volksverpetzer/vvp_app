// Builds and runs the F-Droid (FOSS) variant on a connected Android device or
// emulator: proprietary native modules are excluded from autolinking and
// Config.isFoss is true, like the `fdroid` EAS profile — but as a debug build
// served by Metro.
//
// prepare-fdroid.mjs writes its autolinking exclusions into package.json;
// they are only needed while prebuild/Gradle run, so package.json is restored
// afterwards (also on Ctrl+C). The generated android/ folder stays FOSS-only:
// run `pnpm prebuild --platform android --clean` before the next regular build.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const packageJsonPath = "package.json";
const original = fs.readFileSync(packageJsonPath, "utf8");
const env = { ...process.env, BUILD_FOSS_ONLY: "true" };

// `prebuild --clean` wipes android/, including the untracked local.properties
// that points Gradle at the SDK when ANDROID_HOME isn't set.
const localPropertiesPath = "android/local.properties";
const localProperties = fs.existsSync(localPropertiesPath)
  ? fs.readFileSync(localPropertiesPath, "utf8")
  : undefined;
const restoreLocalProperties = () => {
  if (localProperties && !fs.existsSync(localPropertiesPath)) {
    fs.mkdirSync("android", { recursive: true });
    fs.writeFileSync(localPropertiesPath, localProperties);
  }
};

let restored = false;
const restore = () => {
  if (restored) return;
  restored = true;
  fs.writeFileSync(packageJsonPath, original);
  console.log("[run-fdroid] package.json restored");
  restoreLocalProperties();
};

process.on("SIGINT", () => {
  restore();
  process.exit(130);
});
process.on("SIGTERM", () => {
  restore();
  process.exit(143);
});

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    restore();
    process.exit(result.status ?? 1);
  }
};

try {
  run("node", ["scripts/prepare-fdroid.mjs"]);
  run("npx", ["expo", "prebuild", "--platform", "android", "--clean"]);
  // Gradle needs it right away, not only once the run is over.
  restoreLocalProperties();
  run("npx", ["expo", "run:android", ...process.argv.slice(2)]);
} finally {
  restore();
}
