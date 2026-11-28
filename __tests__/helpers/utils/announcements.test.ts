import { describe, expect, it } from "@jest/globals";

import {
  compareVersions,
  isAnnouncementActive,
  isAnnouncementDate,
  parseAnnouncementDate,
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

describe("announcement dates", () => {
  it.each([
    "2026-10-01T00:00:00+02:00",
    "2026-10-01T00:00+02:00",
    "2026-10-01T00:00:00.000Z",
    "2026-10-31",
  ])("accepts %s", (value) => {
    expect(isAnnouncementDate(value)).toBe(true);
  });

  it.each([
    "1",
    "2026-10-01 00:00:00",
    "2026-10-01T00:00:00",
    "2026-10-01T00:00:00+0200",
    "31.10.2026",
    "2026-02-31",
    "2026-13-01",
    "",
    20261031,
  ])("rejects %s", (value) => {
    expect(isAnnouncementDate(value)).toBe(false);
  });

  it("reads a date-only value as the local start or end of that day", () => {
    expect(parseAnnouncementDate("2026-10-31", "start")).toBe(
      new Date(2026, 9, 31).getTime(),
    );
    expect(parseAnnouncementDate("2026-10-31", "end")).toBe(
      new Date(2026, 10, 1).getTime() - 1,
    );
  });

  it("keeps a date-only endsAt card active for the whole day", () => {
    const entry = { ...base, endsAt: "2026-10-31" };
    expect(
      isAnnouncementActive(entry, new Date(2026, 9, 31, 23, 59), null),
    ).toBe(true);
    expect(isAnnouncementActive(entry, new Date(2026, 10, 1, 0, 0), null)).toBe(
      false,
    );
  });

  it("treats an unparseable stored date as inactive", () => {
    expect(
      isAnnouncementActive({ ...base, startsAt: "morgen" }, now, null),
    ).toBe(false);
  });
});
