import { describe, expect, it } from "@jest/globals";

import {
  hasCreatedAt,
  hasStringProperty,
  hasText,
  hasUri,
  isObjectRecord,
} from "#/helpers/utils/typePredicates";

describe("typePredicates", () => {
  it("isObjectRecord should narrow objects", () => {
    expect(isObjectRecord({ a: 1 })).toBe(true);
    expect(isObjectRecord(null)).toBe(false);
    expect(isObjectRecord("test")).toBe(false);
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
