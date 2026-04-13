import fs from "node:fs";

const packageJsonPath = "package.json";
const raw = fs.readFileSync(packageJsonPath, "utf8");
const pkg = JSON.parse(raw);

pkg.expo ??= {};
pkg.expo.autolinking ??= {};
pkg.expo.autolinking.android ??= {};

const android = pkg.expo.autolinking.android;

// For F-Droid we want to avoid bundling non-free Google/Firebase deps.
// - expo-notifications: pulls in firebase-messaging (GMS)
// - @stripe/stripe-react-native: pulls in stripe-android which bundles play-services-wallet,
//   play-services-maps and Play Integrity even when Google Pay is disabled
const currentExclude = Array.isArray(android.exclude) ? android.exclude : [];
android.exclude = Array.from(
  new Set([
    ...currentExclude,
    "expo-notifications",
    "@stripe/stripe-react-native",
  ]),
);

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(
  "[prepare-fdroid] Added expo.autolinking.android.exclude: expo-notifications, @stripe/stripe-react-native",
);
