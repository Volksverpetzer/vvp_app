import { readFileSync } from "fs";
import { join } from "path";

import type ChangelogType from "#/constants/Changelog";

const loadChangelog = (variant: { isMimikama: boolean }) => {
  let changelog: typeof ChangelogType;
  jest.isolateModules(() => {
    jest.doMock("#/helpers/utils/variant", () => variant);
    changelog = require("#/constants/Changelog").default;
  });
  return changelog;
};

// The release notes the in-app changelog is generated from, so the test
// follows each release instead of pinning one release's wording.
const readNotes = (metadataDir: string, versionCode: number) =>
  readFileSync(
    join(
      __dirname,
      "../../fastlane",
      metadataDir,
      `metadata/android/de-DE/changelogs/${versionCode}.txt`,
    ),
    "utf8",
  ).trim();

describe("Changelog", () => {
  it("shows Volksverpetzer's notes in the Volksverpetzer app", () => {
    const changelog = loadChangelog({ isMimikama: false });
    expect(changelog.notes).toBe(readNotes("", changelog.versionCode));
  });

  it("shows Mimikama its own notes", () => {
    const changelog = loadChangelog({ isMimikama: true });
    expect(changelog.notes).toBe(readNotes("mimikama", changelog.versionCode));
  });

  it("shares version and versionCode across variants", () => {
    const vvp = loadChangelog({ isMimikama: false });
    const mimikama = loadChangelog({ isMimikama: true });
    expect(mimikama.version).toBe(vvp.version);
    expect(mimikama.versionCode).toBe(vvp.versionCode);
  });
});
