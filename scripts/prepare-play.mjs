import fs from "node:fs";

const packageJsonPath = "package.json";
const raw = fs.readFileSync(packageJsonPath, "utf8");
const pkg = JSON.parse(raw);

const android =
  pkg?.expo?.autolinking?.android &&
  typeof pkg.expo.autolinking.android === "object"
    ? pkg.expo.autolinking.android
    : null;

if (!android) {
  console.log(
    "[prepare-play] No expo.autolinking.android found; nothing to do.",
  );
  process.exit(0);
}

if (!Array.isArray(android.exclude)) {
  console.log(
    "[prepare-play] expo.autolinking.android.exclude not set; nothing to do.",
  );
  process.exit(0);
}

android.exclude = android.exclude.filter(
  (name) => name !== "expo-notifications",
);

// Clean up empty objects to reduce diff churn
if (android.exclude.length === 0) {
  delete android.exclude;
}
if (Object.keys(android).length === 0) {
  delete pkg.expo.autolinking.android;
}
if (pkg.expo.autolinking && Object.keys(pkg.expo.autolinking).length === 0) {
  delete pkg.expo.autolinking;
}
if (pkg.expo && Object.keys(pkg.expo).length === 0) {
  delete pkg.expo;
}

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(
  "[prepare-play] Removed expo-notifications from expo.autolinking.android.exclude",
);
