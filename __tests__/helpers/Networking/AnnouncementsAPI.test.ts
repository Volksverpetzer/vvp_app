import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import Config from "#/constants/Config";
import {
  fetchAnnouncements,
  parseAnnouncements,
} from "#/helpers/network/AnnouncementsAPI";

const valid = {
  id: "a",
  message: "**Neu**: hallo",
  actionLabel: "Los",
  route: "/settings",
};

describe("parseAnnouncements", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects documents that are not in the expected shape", () => {
    expect(parseAnnouncements(null)).toBeUndefined();
    expect(parseAnnouncements("<html>error</html>")).toBeUndefined();
    expect(parseAnnouncements([valid])).toBeUndefined();
    expect(parseAnnouncements({ announcements: "nope" })).toBeUndefined();
  });

  it("accepts an empty list", () => {
    expect(parseAnnouncements({ announcements: [] })).toEqual([]);
  });

  it("keeps valid entries including optional fields", () => {
    const entry = {
      ...valid,
      minAppVersion: "4.3.0",
      startsAt: "2026-12-01T00:00:00+01:00",
      endsAt: "2026-12-24",
    };
    expect(parseAnnouncements({ announcements: [entry] })).toEqual([entry]);
  });

  it("strips unknown fields", () => {
    expect(
      parseAnnouncements({ announcements: [{ ...valid, extra: 1 }] }),
    ).toEqual([valid]);
  });

  it.each([
    ["https URL", "https://volksverpetzer.de/abstimmung"],
    ["in-app path", "/(tabs)/contact"],
    [
      "route object",
      { pathname: "/(tabs)/contact", params: { category: "app_feedback" } },
    ],
  ])("accepts a %s as route", (_label, route) => {
    expect(
      parseAnnouncements({ announcements: [{ ...valid, route }] }),
    ).toHaveLength(1);
  });

  it("stringifies numeric route params", () => {
    const [entry] = parseAnnouncements({
      announcements: [
        { ...valid, route: { pathname: "/game/[id]", params: { id: 3 } } },
      ],
    })!;
    expect(entry.route).toEqual({
      pathname: "/game/[id]",
      params: { id: "3" },
    });
  });

  it.each([
    ["missing id", { ...valid, id: undefined }],
    ["empty message", { ...valid, message: " " }],
    ["missing actionLabel", { ...valid, actionLabel: undefined }],
    ["http route", { ...valid, route: "http://example.com" }],
    ["https route without host", { ...valid, route: "https://" }],
    ["https route with only a query", { ...valid, route: "https://?" }],
    ["javascript route", { ...valid, route: "javascript:alert(1)" }],
    ["protocol-relative route", { ...valid, route: "//evil.example" }],
    ["relative route", { ...valid, route: "settings" }],
    ["route object without pathname", { ...valid, route: { params: {} } }],
    [
      "route object with nested params",
      { ...valid, route: { pathname: "/x", params: { a: { b: 1 } } } },
    ],
    ["bad minAppVersion", { ...valid, minAppVersion: "v4" }],
    ["bad startsAt", { ...valid, startsAt: "morgen" }],
    ["bad endsAt", { ...valid, endsAt: 20261224 }],
    ["non-object", "hello"],
  ])("drops an entry with %s but keeps the rest", (_label, entry) => {
    expect(
      parseAnnouncements({ announcements: [entry, { ...valid, id: "b" }] }),
    ).toEqual([{ ...valid, id: "b" }]);
  });

  it("rejects a non-empty list where every entry is invalid", () => {
    expect(
      parseAnnouncements({
        announcements: [{ ...valid, route: undefined, url: "/settings" }],
      }),
    ).toBeUndefined();
  });

  it.each([
    ["date without offset", { ...valid, startsAt: "2026-10-01T00:00:00" }],
    ["German date", { ...valid, endsAt: "31.10.2026" }],
  ])("drops an entry with a %s", (_label, entry) => {
    expect(
      parseAnnouncements({ announcements: [entry, { ...valid, id: "b" }] }),
    ).toEqual([{ ...valid, id: "b" }]);
  });

  it("keeps only the first entry for a repeated id", () => {
    expect(
      parseAnnouncements({
        announcements: [valid, { ...valid, message: "duplicate" }],
      }),
    ).toEqual([valid]);
  });
});

describe("fetchAnnouncements", () => {
  const originalUrl = Config.announcementsUrl;
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    (globalThis as any).fetch = fetchMock;
    fetchMock.mockReset();
  });
  afterEach(() => {
    Config.announcementsUrl = originalUrl;
  });

  it("resolves to undefined without fetching when no URL is configured", async () => {
    Config.announcementsUrl = undefined;
    await expect(fetchAnnouncements()).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches and validates the configured file", async () => {
    Config.announcementsUrl = "https://cdn.example/announcements/vvp.json";
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ announcements: [valid] }), { status: 200 }),
    );
    await expect(fetchAnnouncements()).resolves.toEqual([valid]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://cdn.example/announcements/vvp.json",
    );
  });

  it("resolves to undefined for a missing file without logging it", async () => {
    Config.announcementsUrl = "https://cdn.example/announcements/vvp.json";
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("", { status: 404 }));
    await expect(fetchAnnouncements()).resolves.toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("still throws on other HTTP errors", async () => {
    Config.announcementsUrl = "https://cdn.example/announcements/vvp.json";
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("", { status: 403 }));
    await expect(fetchAnnouncements()).rejects.toThrow();
    errorSpy.mockRestore();
  });
});
