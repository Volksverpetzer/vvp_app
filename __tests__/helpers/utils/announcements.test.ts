import { describe, expect, it } from "@jest/globals";

import {
  compareVersions,
  isAnnouncementActive,
} from "#/helpers/utils/announcements";
import type { AnnouncementEntry } from "#/types";

const base: AnnouncementEntry = {
  id: "a",
  message: "m",
  actionLabel: "l",
  route: "/settings",
};
const now = new Date("2026-12-10T12:00:00Z");

describe("compareVersions", () => {
  it.each([
    ["4.10.0", "4.9.2", 1],
    ["4.3.0", "4.3", 0],
    ["4.2.9", "4.3.0", -1],
    ["5", "4.99.99", 1],
  ])("compares %s with %s", (a, b, sign) => {
    expect(Math.sign(compareVersions(a, b))).toBe(sign);
  });
});

describe("isAnnouncementActive", () => {
  it("is active without any restrictions", () => {
    expect(isAnnouncementActive(base, now, "4.0.0")).toBe(true);
  });

  it("respects startsAt and endsAt", () => {
    expect(
      isAnnouncementActive({ ...base, startsAt: "2026-12-11" }, now, null),
    ).toBe(false);
    expect(
      isAnnouncementActive({ ...base, endsAt: "2026-12-09" }, now, null),
    ).toBe(false);
    expect(
      isAnnouncementActive(
        { ...base, startsAt: "2026-12-01", endsAt: "2026-12-24" },
        now,
        null,
      ),
    ).toBe(true);
  });

  it("hides cards for newer app versions", () => {
    const entry = { ...base, minAppVersion: "4.3.0" };
    expect(isAnnouncementActive(entry, now, "4.2.9")).toBe(false);
    expect(isAnnouncementActive(entry, now, "4.3.0")).toBe(true);
    expect(isAnnouncementActive(entry, now, "4.10.0")).toBe(true);
  });

  it("does not block on an unknown app version", () => {
    expect(
      isAnnouncementActive({ ...base, minAppVersion: "4.3.0" }, now, null),
    ).toBe(true);
  });
});
