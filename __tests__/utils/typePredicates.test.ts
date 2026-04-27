import { describe, expect, it } from "@jest/globals";

import {
  hasCreatedAt,
  hasStringProperty,
  hasText,
  hasUri,
  isObjectRecord,
  isValidFavorites,
  isValidSources,
  isValidStoredFav,
  isValidStoredSource,
} from "#/helpers/utils/typePredicates";

describe("typePredicates", () => {
  it("isObjectRecord should narrow objects", () => {
    expect(isObjectRecord({ a: 1 })).toBe(true);
    expect(isObjectRecord(null)).toBe(false);
    expect(isObjectRecord("test")).toBe(false);
    expect(isObjectRecord([])).toBe(false);
  });

  it("hasStringProperty should validate string fields", () => {
    expect(hasStringProperty({ foo: "bar" }, "foo")).toBe(true);
    expect(hasStringProperty({ foo: 123 }, "foo")).toBe(false);
  });

  it("hasUri should validate uri field", () => {
    expect(hasUri({ uri: "at://post/1" })).toBe(true);
    expect(hasUri({ uri: 1 })).toBe(false);
  });

  it("hasCreatedAt should validate created_at field", () => {
    expect(hasCreatedAt({ created_at: "2026-01-01T12:00:00Z" })).toBe(true);
    expect(hasCreatedAt({ createdAt: "2026-01-01T12:00:00Z" })).toBe(false);
  });

  it("hasText should validate text field", () => {
    expect(hasText({ text: "hello" })).toBe(true);
    expect(hasText({ text: 42 })).toBe(false);
  });
});

describe("isValidStoredFav", () => {
  it("accepts article contentType", () => {
    expect(isValidStoredFav({ contentType: "article" })).toBe(true);
  });

  it("accepts insta contentType", () => {
    expect(isValidStoredFav({ contentType: "insta" })).toBe(true);
  });

  it("rejects unknown contentType", () => {
    expect(isValidStoredFav({ contentType: "video" })).toBe(false);
  });

  it("rejects non-object", () => {
    expect(isValidStoredFav(null)).toBe(false);
    expect(isValidStoredFav("article")).toBe(false);
  });
});

describe("isValidStoredSource", () => {
  it("accepts object with string slug", () => {
    expect(isValidStoredSource({ slug: "my-source" })).toBe(true);
  });

  it("rejects object with non-string slug", () => {
    expect(isValidStoredSource({ slug: 42 })).toBe(false);
  });

  it("rejects missing slug", () => {
    expect(isValidStoredSource({})).toBe(false);
  });

  it("rejects non-object", () => {
    expect(isValidStoredSource(null)).toBe(false);
  });
});

describe("isValidFavorites", () => {
  it("accepts a map of valid favorites", () => {
    expect(
      isValidFavorites({
        abc: { contentType: "article" },
        def: { contentType: "insta" },
      }),
    ).toBe(true);
  });

  it("accepts an empty object", () => {
    expect(isValidFavorites({})).toBe(true);
  });

  it("rejects when any entry has an invalid contentType", () => {
    expect(
      isValidFavorites({
        abc: { contentType: "article" },
        bad: { contentType: "video" },
      }),
    ).toBe(false);
  });

  it("rejects non-object values", () => {
    expect(isValidFavorites(null)).toBe(false);
    expect(isValidFavorites([])).toBe(false);
  });
});

describe("isValidSources", () => {
  it("accepts a map of valid sources keyed by https URL", () => {
    expect(isValidSources({ "https://example.com": { slug: "example" } })).toBe(
      true,
    );
  });

  it("accepts an empty object", () => {
    expect(isValidSources({})).toBe(true);
  });

  it("rejects keys that do not start with https://", () => {
    expect(isValidSources({ "http://example.com": { slug: "x" } })).toBe(false);
    expect(isValidSources({ "example.com": { slug: "x" } })).toBe(false);
  });

  it("rejects when any source has a non-string slug", () => {
    expect(isValidSources({ "https://example.com": { slug: 99 } })).toBe(false);
  });

  it("rejects non-object values", () => {
    expect(isValidSources(null)).toBe(false);
    expect(isValidSources([])).toBe(false);
  });
});
