import { describe, expect, it } from "@jest/globals";

import { parseInlineMarkdown } from "#/helpers/utils/inlineMarkdown";

describe("parseInlineMarkdown", () => {
  it("returns a single text token for plain strings", () => {
    expect(parseInlineMarkdown("just text")).toEqual([
      { type: "text", content: "just text" },
    ]);
  });

  it("parses a leading bold segment with trailing text", () => {
    expect(parseInlineMarkdown("**Neu**: hallo")).toEqual([
      { type: "bold", content: "Neu" },
      { type: "text", content: ": hallo" },
    ]);
  });

  it("parses italic segments", () => {
    expect(parseInlineMarkdown("go to *settings* now")).toEqual([
      { type: "text", content: "go to " },
      { type: "italic", content: "settings" },
      { type: "text", content: " now" },
    ]);
  });

  it("parses links into text + url", () => {
    expect(parseInlineMarkdown("see [site](https://example.com)")).toEqual([
      { type: "text", content: "see " },
      { type: "link", content: "site", url: "https://example.com" },
    ]);
  });

  it("prefers bold over italic at a `**` boundary", () => {
    expect(parseInlineMarkdown("**both**")).toEqual([
      { type: "bold", content: "both" },
    ]);
  });

  it("emits a lone asterisk verbatim", () => {
    expect(parseInlineMarkdown("2 * 3 = 6")).toEqual([
      { type: "text", content: "2 * 3 = 6" },
    ]);
  });

  it("handles a mix of all token types", () => {
    expect(
      parseInlineMarkdown("**A** and *b*, then [c](https://x.dev)."),
    ).toEqual([
      { type: "bold", content: "A" },
      { type: "text", content: " and " },
      { type: "italic", content: "b" },
      { type: "text", content: ", then " },
      { type: "link", content: "c", url: "https://x.dev" },
      { type: "text", content: "." },
    ]);
  });
});
