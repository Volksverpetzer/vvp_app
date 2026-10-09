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
 * Usage: node scripts/prepare-play-metadata.mjs --play-version-code <code> [--app volksverpetzer|mimikama]
 * Output: build/play-metadata/android
 *
 * Volksverpetzer's metadata lives in fastlane/metadata (the path F-Droid also
 * reads); other apps keep theirs in fastlane/<app>/metadata. The changelog
 * file is picked by the shared package.json versionCode in both cases.
 */
import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
};

const playVersionCode = Number.parseInt(arg("play-version-code"), 10);
const app = arg("app") ?? "volksverpetzer";

const APP_METADATA_DIRS = {
  volksverpetzer: "fastlane/metadata/android",
  mimikama: "fastlane/mimikama/metadata/android",
};

if (!Number.isInteger(playVersionCode) || playVersionCode <= 0) {
  console.error(
    "Usage: node scripts/prepare-play-metadata.mjs --play-version-code <code> [--app volksverpetzer|mimikama]",
  );
  process.exit(1);
}

if (!(app in APP_METADATA_DIRS)) {
  console.error(
    `✗ Unknown app '${app}' (expected one of: ${Object.keys(APP_METADATA_DIRS).join(", ")})`,
  );
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const { versionCode } = pkg;

const sourceRelative = APP_METADATA_DIRS[app];
const source = resolve(root, sourceRelative);
const target = resolve(root, "build/play-metadata/android");

if (!existsSync(source)) {
  console.error(`✗ No fastlane metadata found at ${sourceRelative}`);
  process.exit(1);
}

// Google Play's limits, in characters. Checked here so a too-long text fails
// in CI with a clear message instead of as an opaque Play API error.
const LIMITS = [
  ["title.txt", 30],
  ["short_description.txt", 80],
  ["full_description.txt", 4000],
];
const CHANGELOG_LIMIT = 500;

const assertWithinLimit = (file, limit) => {
  if (!existsSync(file)) return;
  const length = [...readFileSync(file, "utf8").trim()].length;
  if (length > limit) {
    console.error(`✗ ${file} has ${length} characters (limit ${limit})`);
    process.exit(1);
  }
};

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

for (const locale of readdirSync(target)) {
  rmSync(resolve(target, locale, "images"), { recursive: true, force: true });

  for (const [name, limit] of LIMITS) {
    assertWithinLimit(resolve(target, locale, name), limit);
  }

  const changelogDir = resolve(target, locale, "changelogs");
  if (!existsSync(resolve(changelogDir, `${versionCode}.txt`))) {
    console.error(
      `✗ No changelog found at ${sourceRelative}/${locale}/changelogs/${versionCode}.txt`,
    );
    console.error(
      app === "volksverpetzer"
        ? "  Create this file with release notes (pnpm prepare:changelog), then re-run this script."
        : "  Create this file with the release notes, then re-run this script.",
    );
    process.exit(1);
  }

  assertWithinLimit(
    resolve(changelogDir, `${versionCode}.txt`),
    CHANGELOG_LIMIT,
  );

  for (const file of readdirSync(changelogDir)) {
    if (file !== `${versionCode}.txt` && file !== `${playVersionCode}.txt`) {
      rmSync(resolve(changelogDir, file));
    }
  }

  if (versionCode !== playVersionCode) {
    renameSync(
      resolve(changelogDir, `${versionCode}.txt`),
      resolve(changelogDir, `${playVersionCode}.txt`),
    );
  }
  console.log(
    `✓ ${locale}: ${versionCode}.txt → ${playVersionCode}.txt (EAS versionCode)`,
  );
}

console.log(`✓ Play metadata prepared at build/play-metadata/android`);
