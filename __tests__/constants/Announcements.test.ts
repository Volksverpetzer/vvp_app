import { describe, expect, it, jest } from "@jest/globals";

import type AnnouncementsType from "#/constants/Announcements";

const loadAnnouncements = (variant: {
  isVolksverpetzer: boolean;
  isMimikama: boolean;
}) => {
  let Announcements: typeof AnnouncementsType;
  jest.isolateModules(() => {
    jest.doMock("#/helpers/utils/variant", () => variant);
    Announcements = require("#/constants/Announcements").default;
  });
  return Announcements!;
};

describe("Announcements", () => {
  it("has VVP's podcast/Prüfpunkt announcement on the Volksverpetzer variant", () => {
    const Announcements = loadAnnouncements({
      isVolksverpetzer: true,
      isMimikama: false,
    });
    expect(Announcements).toHaveLength(1);
    expect(Announcements[0].id).toBe("podcast-pruefpunkt-2026-08");
  });

  it("has the under-the-hood announcement on the Mimikama variant", () => {
    const Announcements = loadAnnouncements({
      isVolksverpetzer: false,
      isMimikama: true,
    });
    expect(Announcements).toHaveLength(1);
    expect(Announcements[0].id).toBe("under-the-hood-2026-09");
    expect(Announcements[0].route).toEqual({
      pathname: "/(tabs)/contact",
      params: { category: "app_feedback" },
    });
  });

  it("is empty for a variant with no announcements of its own", () => {
    const Announcements = loadAnnouncements({
      isVolksverpetzer: false,
      isMimikama: false,
    });
    expect(Announcements).toEqual([]);
  });
});
