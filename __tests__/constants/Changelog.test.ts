import type ChangelogType from "#/constants/Changelog";

const loadChangelog = (variant: { isMimikama: boolean }) => {
  let changelog: typeof ChangelogType;
  jest.isolateModules(() => {
    jest.doMock("#/helpers/utils/variant", () => variant);
    changelog = require("#/constants/Changelog").default;
  });
  return changelog;
};

describe("Changelog", () => {
  it("shows Volksverpetzer's notes in the Volksverpetzer app", () => {
    const changelog = loadChangelog({ isMimikama: false });
    expect(changelog.notes).toContain("Prüfpunkt");
  });

  it("shows Mimikama its own notes, without Volksverpetzer-only features", () => {
    const changelog = loadChangelog({ isMimikama: true });
    expect(changelog.notes).not.toContain("Prüfpunkt");
    expect(changelog.notes).not.toBe(
      loadChangelog({ isMimikama: false }).notes,
    );
  });

  it("shares version and versionCode across variants", () => {
    const vvp = loadChangelog({ isMimikama: false });
    const mimikama = loadChangelog({ isMimikama: true });
    expect(mimikama.version).toBe(vvp.version);
    expect(mimikama.versionCode).toBe(vvp.versionCode);
  });
});
