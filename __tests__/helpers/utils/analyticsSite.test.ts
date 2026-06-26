import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Linking from "expo-linking";

import { resolveAnalyticsSite } from "#/helpers/utils/analyticsSite";

jest.mock("expo-linking", () => ({
  __esModule: true,
  parse: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    feeds: {
      wp: [
        { handle: "https://www.volksverpetzer.de", enabled: true },
        { handle: "https://www.pruefpunkt.org", enabled: true },
      ],
    },
  },
}));

describe("resolveAnalyticsSite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Realistic host extraction so the allow-list logic is actually exercised.
    jest.spyOn(Linking, "parse").mockImplementation((url: string) => {
      const u = new URL(url);
      return { hostname: u.hostname, path: u.pathname } as ReturnType<
        typeof Linking.parse
      >;
    });
  });

  it("returns the normalized primary site for a volksverpetzer permalink", () => {
    expect(resolveAnalyticsSite("https://www.volksverpetzer.de/foo")).toBe(
      "volksverpetzer.de",
    );
  });

  it("returns the pruefpunkt site for a pruefpunkt permalink", () => {
    expect(resolveAnalyticsSite("https://www.pruefpunkt.org/foo")).toBe(
      "pruefpunkt.org",
    );
  });

  it("falls back to the primary site for an unconfigured host", () => {
    expect(resolveAnalyticsSite("https://volksverpetzer-shop.de/x")).toBe(
      "volksverpetzer.de",
    );
  });

  it("falls back to the primary site when no permalink is given", () => {
    expect(resolveAnalyticsSite(undefined)).toBe("volksverpetzer.de");
  });
});
