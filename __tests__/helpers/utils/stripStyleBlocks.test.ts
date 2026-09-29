import { describe, expect, it } from "@jest/globals";

import { stripStyleBlocks } from "#/helpers/utils/stripStyleBlocks";

describe("stripStyleBlocks", () => {
  it("removes a single style block", () => {
    expect(stripStyleBlocks("<style>.a{color:red}</style><p>Text</p>")).toBe(
      "<p>Text</p>",
    );
  });

  it("keeps the article body between two separate style blocks", () => {
    // Richer Mimikama layouts emit a second <style> block partway through
    // the article (e.g. for a later custom component group). A greedy,
    // non-global pattern matches from the first "<style>" to the LAST
    // "</style>" in the whole string, deleting everything in between —
    // this is the exact shape of a real article that regressed that way.
    const html =
      "<style>.a{color:red}</style>" +
      "<div>Der komplette Artikeltext steht hier.</div>" +
      "<style>.b{color:blue}</style>" +
      "<div>Quellen</div>";

    expect(stripStyleBlocks(html)).toBe(
      "<div>Der komplette Artikeltext steht hier.</div><div>Quellen</div>",
    );
  });

  it("handles a style block containing a newline", () => {
    const html = "<style>\n.a{\n  color:red;\n}\n</style><p>Text</p>";
    expect(stripStyleBlocks(html)).toBe("<p>Text</p>");
  });

  it("returns the input unchanged when there is no style block", () => {
    const html = "<p>Nothing to strip here.</p>";
    expect(stripStyleBlocks(html)).toBe(html);
  });

  it("leaves an unterminated style block's content as-is (no matching close tag)", () => {
    const html = "<style>.a{color:red}<p>Text</p>";
    expect(stripStyleBlocks(html)).toBe(html);
  });
});
