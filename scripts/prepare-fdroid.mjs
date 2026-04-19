import fs from "node:fs";

const packageJsonPath = "package.json";
const raw = fs.readFileSync(packageJsonPath, "utf8");
const pkg = JSON.parse(raw);

pkg.expo ??= {};
pkg.expo.autolinking ??= {};
pkg.expo.autolinking.android ??= {};

const android = pkg.expo.autolinking.android;

// Build all Expo Android modules from Kotlin source instead of using the
// pre-built .aar files shipped in local-maven-repo/. Required for fdroid
// compliance ("build from source"). Pattern: same approach used by Ladefuchs
// (app.ladefuchs.android) since their 3.3.3 release.
const currentBuildFromSource = Array.isArray(android.buildFromSource)
  ? android.buildFromSource
  : [];
android.buildFromSource = Array.from(
  new Set([...currentBuildFromSource, ".*"]),
);

// Exclude packages that bundle proprietary Google/Firebase deps.
// The autolinking.android.exclude field in app.config.ts is only respected by
// EAS cloud builds, not by local `expo prebuild`. Writing to package.json here
// ensures expo-modules-autolinking picks it up during local prebuild.
const currentExclude = Array.isArray(android.exclude) ? android.exclude : [];
android.exclude = Array.from(
  new Set([
    ...currentExclude,
    "expo-notifications", // pulls in firebase-messaging (GMS)
    "@stripe/stripe-react-native", // bundles play-services-wallet, play-services-maps, Play Integrity
    "expo-dev-client", // dev-only; depends on expo-dev-menu-interface
    "expo-dev-launcher", // dev-only, not needed in release builds
    "expo-dev-menu", // dev-only, not needed in release builds
    "expo-dev-menu-interface", // dev-only, not needed in release builds
  ]),
);

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
console.log("[prepare-fdroid] autolinking exclusions written to package.json");
