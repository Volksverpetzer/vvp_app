import fs from "node:fs";

const packageJsonPath = "package.json";
const raw = fs.readFileSync(packageJsonPath, "utf8");
const pkg = JSON.parse(raw);

pkg.expo ??= {};
pkg.expo.autolinking ??= {};
pkg.expo.autolinking.android ??= {};

const android = pkg.expo.autolinking.android;

// For F-Droid we want to avoid bundling non-free Google/Firebase deps.
// Excluding `expo-notifications` from Android autolinking prevents its native module
// (and its firebase-messaging dependency) from being compiled into the APK.
const currentExclude = Array.isArray(android.exclude) ? android.exclude : [];
android.exclude = Array.from(
  new Set([...currentExclude, "expo-notifications"]),
);

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(
  "[prepare-fdroid] Added expo.autolinking.android.exclude: expo-notifications",
);
