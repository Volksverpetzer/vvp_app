import { describe, expect, it } from "@jest/globals";

import { getEnabledFeeds } from "#/helpers/utils/feeds";
import type { FeedsConfig } from "#/types";

describe("getEnabledFeeds", () => {
  it("returns only enabled feed keys", () => {
    const config: FeedsConfig = {
      reddit: { enabled: true },
      wp: { enabled: false },
      bsky: { enabled: true },
    };
    expect(getEnabledFeeds(config)).toEqual(
      expect.arrayContaining(["reddit", "bsky"]),
    );
    expect(getEnabledFeeds(config)).not.toContain("wp");
  });

  it("returns an empty array when all feeds are disabled", () => {
    const config: FeedsConfig = {
      reddit: { enabled: false },
      wp: { enabled: false },
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
      wp: { enabled: true },
      insta: { enabled: true },
    };
    const result = getEnabledFeeds(config);
    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining(["reddit", "wp", "insta"]));
  });
});
