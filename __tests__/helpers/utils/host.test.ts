import { describe, expect, it } from "@jest/globals";

import {
  isSameHost,
  normalizeHost,
  normalizedHostOf,
} from "#/helpers/utils/host";

describe("normalizeHost", () => {
  it("strips a leading www. and lower-cases", () => {
    expect(normalizeHost("www.Volksverpetzer.de")).toBe("volksverpetzer.de");
  });

  it("leaves a host without www. unchanged", () => {
    expect(normalizeHost("volksverpetzer.de")).toBe("volksverpetzer.de");
  });

  it("only strips a leading www., not www inside the host", () => {
    expect(normalizeHost("wwwx.example.com")).toBe("wwwx.example.com");
  });

  it("returns an empty string for null/undefined", () => {
    expect(normalizeHost(undefined)).toBe("");
    expect(normalizeHost(null)).toBe("");
  });
});

describe("normalizedHostOf", () => {
  it("extracts and normalizes the host from a URL", () => {
    expect(normalizedHostOf("https://www.volksverpetzer.de/foo/bar")).toBe(
      "volksverpetzer.de",
    );
  });

  it("returns '' for a non-absolute or empty value", () => {
    expect(normalizedHostOf("/foo/bar")).toBe("");
    expect(normalizedHostOf(undefined)).toBe("");
  });
});

describe("isSameHost", () => {
  it("matches www and non-www variants of the same host", () => {
    expect(
      isSameHost(
        "https://volksverpetzer.de/x",
        "https://www.volksverpetzer.de",
      ),
    ).toBe(true);
  });

  it("does not match different hosts", () => {
    expect(
      isSameHost("https://pruefpunkt.org/x", "https://www.volksverpetzer.de"),
    ).toBe(false);
  });

  it("returns false when a host cannot be determined", () => {
    expect(isSameHost("/relative", "https://www.volksverpetzer.de")).toBe(
      false,
    );
  });
});
