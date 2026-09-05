/**
 * Generates store.config.json for `eas metadata:push` (App Store) from the
 * fastlane changelog of the current package.json versionCode.
 *
 * Only releaseNotes are pushed on purpose — the App Store listing texts
 * (title, description, keywords) are managed in App Store Connect and differ
 * from the Google Play texts kept in this repo.
 *
 * Usage: node scripts/prepare-store-config.mjs
 * Output: store.config.json (git-ignored, generated per release in CI)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const { versionCode } = pkg;

const info = {};

for (const locale of ["de-DE", "en-US"]) {
  const changelogPath = resolve(
    root,
    `fastlane/metadata/android/${locale}/changelogs/${versionCode}.txt`,
  );
  if (!existsSync(changelogPath)) {
    console.error(
      `✗ No changelog found at fastlane/metadata/android/${locale}/changelogs/${versionCode}.txt`,
    );
    process.exit(1);
  }
  info[locale] = { releaseNotes: readFileSync(changelogPath, "utf8").trim() };
}

const config = {
  configVersion: 0,
  apple: { info },
};

writeFileSync(
  resolve(root, "store.config.json"),
  `${JSON.stringify(config, null, 2)}\n`,
  "utf8",
);
console.log(`✓ Generated store.config.json with release notes ${versionCode}`);
