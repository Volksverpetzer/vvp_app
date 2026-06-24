import { describe, expect, it, jest } from "@jest/globals";

import { redirectSystemPath } from "#/app/+native-intent";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://www.volksverpetzer.de" },
}));

jest.mock("#/helpers/DeepLinkFilter", () => ({
  __esModule: true,
  shouldExcludeFromDeepLink: (path: string) =>
    path.startsWith("/wp-content/uploads/"),
}));

describe("redirectSystemPath", () => {
  it("routes the share-intent host to /handle-share", () => {
    expect(redirectSystemPath({ path: "myapp://expo-sharing" })).toBe(
      "/handle-share",
    );
  });

  it("strips the origin for a www link matching wpUrl", () => {
    expect(
      redirectSystemPath({ path: "https://www.volksverpetzer.de/cat/slug/" }),
    ).toBe("/cat/slug/");
  });

  it("treats a non-www link as the same host (www-insensitive)", () => {
    expect(
      redirectSystemPath({ path: "https://volksverpetzer.de/cat/slug/" }),
    ).toBe("/cat/slug/");
  });

  it("returns undefined for excluded paths so the OS handles them", () => {
    expect(
      redirectSystemPath({
        path: "https://volksverpetzer.de/wp-content/uploads/file.pdf",
      }),
    ).toBeUndefined();
  });

  it("passes through unrelated/relative paths unchanged", () => {
    expect(redirectSystemPath({ path: "/home" })).toBe("/home");
    expect(redirectSystemPath({ path: "https://example.com/x" })).toBe(
      "https://example.com/x",
    );
  });
});
