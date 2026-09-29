import { describe, expect, it, jest } from "@jest/globals";

import type AnnouncementsType from "#/constants/Announcements";

describe("Announcements", () => {
  it("has VVP's podcast/Prüfpunkt announcement on the Volksverpetzer variant", () => {
    let Announcements: typeof AnnouncementsType;
    jest.isolateModules(() => {
      jest.doMock("#/helpers/utils/variant", () => ({
        isVolksverpetzer: true,
      }));
      Announcements = require("#/constants/Announcements").default;
    });
    expect(Announcements!).toHaveLength(1);
    expect(Announcements![0].id).toBe("podcast-pruefpunkt-2026-08");
  });

  it("is empty for every other variant (e.g. Mimikama)", () => {
    let Announcements: typeof AnnouncementsType;
    jest.isolateModules(() => {
      jest.doMock("#/helpers/utils/variant", () => ({
        isVolksverpetzer: false,
      }));
      Announcements = require("#/constants/Announcements").default;
    });
    expect(Announcements!).toEqual([]);
  });
});
