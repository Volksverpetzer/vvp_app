import { describe, expect, it } from "@jest/globals";

import {
  getEnabledFeeds,
  getInstaFeedKey,
  getWpFeedKey,
} from "#/helpers/utils/feeds";
import type { FeedsConfig } from "#/types";

describe("getWpFeedKey", () => {
  it("derives the key from the handle hostname without www", () => {
    expect(
      getWpFeedKey({ handle: "https://www.pruefpunkt.org", label: "x" }),
    ).toBe("wp:pruefpunkt.org");
  });

  it("ignores paths and keeps bare hostnames", () => {
    expect(
      getWpFeedKey({ handle: "https://volksverpetzer.de/blog", label: "x" }),
    ).toBe("wp:volksverpetzer.de");
  });
});

describe("getInstaFeedKey", () => {
  it("derives the key from the account handle", () => {
    expect(getInstaFeedKey({ handle: "pruefpunkt", label: "x" })).toBe(
      "insta:pruefpunkt",
    );
  });
});

describe("getEnabledFeeds", () => {
  it("returns only enabled feed keys", () => {
    const config: FeedsConfig = {
      reddit: { enabled: true },
      wp: [
        { handle: "https://www.volksverpetzer.de", label: "Artikel" },
        {
          handle: "https://www.pruefpunkt.org",
          label: "Prüfpunkt Artikel",
          enabled: true,
        },
      ],
      bsky: { enabled: true },
    };
    expect(getEnabledFeeds(config)).toEqual(
      expect.arrayContaining(["reddit", "bsky", "wp:pruefpunkt.org"]),
    );
    expect(getEnabledFeeds(config)).not.toContain("wp:volksverpetzer.de");
  });

  it("returns one key per enabled wp entry", () => {
    const config: FeedsConfig = {
      wp: [
        {
          handle: "https://www.volksverpetzer.de",
          label: "Artikel",
          enabled: true,
        },
        {
          handle: "https://www.pruefpunkt.org",
          label: "Prüfpunkt Artikel",
          enabled: true,
        },
      ],
    };
    expect(getEnabledFeeds(config)).toEqual([
      "wp:volksverpetzer.de",
      "wp:pruefpunkt.org",
    ]);
  });

  it("returns an empty array when all feeds are disabled", () => {
    const config: FeedsConfig = {
      reddit: { enabled: false },
      wp: [{ handle: "https://www.volksverpetzer.de", label: "Artikel" }],
    };
    expect(getEnabledFeeds(config)).toEqual([]);
  });

  it("returns an empty array for an empty config", () => {
    expect(getEnabledFeeds({})).toEqual([]);
  });

  it("treats missing enabled field as disabled", () => {
    const config: FeedsConfig = {
      reddit: { handle: "@foo" },
    };
    expect(getEnabledFeeds(config)).toEqual([]);
  });

  it("returns all feeds when all are enabled", () => {
    const config: FeedsConfig = {
      reddit: { enabled: true },
      wp: [
        {
          handle: "https://www.volksverpetzer.de",
          label: "Artikel",
          enabled: true,
        },
      ],
      insta: [
        { handle: "volksverpetzer", label: "Instagram Slides", enabled: true },
      ],
    };
    const result = getEnabledFeeds(config);
    expect(result).toHaveLength(3);
    expect(result).toEqual(
      expect.arrayContaining([
        "reddit",
        "wp:volksverpetzer.de",
        "insta:volksverpetzer",
      ]),
    );
  });

  it("returns one key per enabled insta entry", () => {
    const config: FeedsConfig = {
      insta: [
        { handle: "volksverpetzer", label: "Instagram Slides", enabled: true },
        { handle: "pruefpunkt", label: "Prüfpunkt Instagram", enabled: true },
        { handle: "disabled-account", label: "Aus" },
      ],
    };
    expect(getEnabledFeeds(config)).toEqual([
      "insta:volksverpetzer",
      "insta:pruefpunkt",
    ]);
  });
});
