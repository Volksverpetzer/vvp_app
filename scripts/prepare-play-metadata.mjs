/**
 * Prepares a copy of fastlane/metadata for `fastlane supply` (Google Play).
 *
 * The changelog files are named after the package.json versionCode, but the
 * APK that EAS submits to Google Play carries an EAS-managed versionCode
 * (appVersionSource: "remote" + autoIncrement). Supply matches changelog
 * files to the versionCodes on the Play track, so the current release notes
 * are renamed to the EAS versionCode. All other changelogs and the images
 * are dropped from the copy (screenshots/images are managed in the Play
 * Console, not from this repo).
 *
 * Usage: node scripts/prepare-play-metadata.mjs --play-version-code <code>
 * Output: build/play-metadata/android
 */
import { cpSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const argIndex = process.argv.indexOf("--play-version-code");
const playVersionCode =
  argIndex === -1 ? NaN : Number.parseInt(process.argv[argIndex + 1], 10);

if (!Number.isInteger(playVersionCode) || playVersionCode <= 0) {
  console.error(
    "Usage: node scripts/prepare-play-metadata.mjs --play-version-code <code>",
  );
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const { versionCode } = pkg;

const source = resolve(root, "fastlane/metadata/android");
const target = resolve(root, "build/play-metadata/android");

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

for (const locale of readdirSync(target)) {
  rmSync(resolve(target, locale, "images"), { recursive: true, force: true });

  const changelogDir = resolve(target, locale, "changelogs");
  for (const file of readdirSync(changelogDir)) {
    if (file === `${versionCode}.txt`) {
      renameSync(
        resolve(changelogDir, file),
        resolve(changelogDir, `${playVersionCode}.txt`),
      );
      console.log(
        `✓ ${locale}: ${file} → ${playVersionCode}.txt (EAS versionCode)`,
      );
    } else {
      rmSync(resolve(changelogDir, file));
    }
  }
}

console.log(`✓ Play metadata prepared at build/play-metadata/android`);
