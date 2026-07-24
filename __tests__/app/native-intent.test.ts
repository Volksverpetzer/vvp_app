import { describe, expect, it, jest } from "@jest/globals";

import { redirectSystemPath } from "#/app/+native-intent";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    feeds: {
      wp: [
        { handle: "https://volksverpetzer.de", enabled: true },
        { handle: "https://pruefpunkt.org", enabled: true },
      ],
    },
  },
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

  it("routes excluded upload paths to the external-link screen so they open in the browser", () => {
    const uploadUrl =
      "https://volksverpetzer.de/wp-content/uploads/2024/11/file.pdf";
    expect(redirectSystemPath({ path: uploadUrl })).toBe(
      `/external-link?url=${encodeURIComponent(uploadUrl)}`,
    );
  });

  it("routes a secondary-host (Prüfpunkt) upload path to the external-link screen too", () => {
    const uploadUrl =
      "https://www.pruefpunkt.org/wp-content/uploads/2024/11/file.pdf";
    expect(redirectSystemPath({ path: uploadUrl })).toBe(
      `/external-link?url=${encodeURIComponent(uploadUrl)}`,
    );
  });

  it("keeps the #fragment so anchored links can jump to their section", () => {
    expect(
      redirectSystemPath({
        path: "https://www.volksverpetzer.de/project/10fakten/#quellen",
      }),
    ).toBe("/project/10fakten/#quellen");
  });

  it("keeps query string and fragment together", () => {
    expect(
      redirectSystemPath({
        path: "https://volksverpetzer.de/cat/slug/?utm_source=x#quellen",
      }),
    ).toBe("/cat/slug/?utm_source=x#quellen");
  });

  it("passes through unrelated/relative paths unchanged", () => {
    expect(redirectSystemPath({ path: "/home" })).toBe("/home");
    expect(redirectSystemPath({ path: "https://example.com/x" })).toBe(
      "https://example.com/x",
    );
  });

  it("appends originalUrl for a secondary feed host so it fetches the right site", () => {
    const result = redirectSystemPath({
      path: "https://www.pruefpunkt.org/faktencheck/slug/",
    });
    expect(result).toBe(
      "/faktencheck/slug/?originalUrl=" +
        encodeURIComponent("https://www.pruefpunkt.org/faktencheck/slug/"),
    );
  });

  it("does not append originalUrl for the primary site", () => {
    expect(
      redirectSystemPath({ path: "https://volksverpetzer.de/cat/slug/" }),
    ).toBe("/cat/slug/");
  });
});
