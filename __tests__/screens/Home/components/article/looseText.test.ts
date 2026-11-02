import TRenderEngine from "@native-html/transient-render-engine";
import type { Document, Element } from "domhandler";
import { isTag } from "domhandler";
import { textContent } from "domutils";

import { wrapLooseText } from "#/screens/Home/components/article/looseText";

const engine = new TRenderEngine();

const parse = (html: string) =>
  engine.parseDocument(html) as unknown as Document;

const bodyOf = (document: Document) => {
  const html = document.children.find(isTag) as Element;
  return html.tagName === "body"
    ? html
    : (html.children.find(
        (node) => isTag(node) && node.tagName === "body",
      ) as Element);
};

const topLevel = (document: Document) =>
  bodyOf(document)
    .children.filter(isTag)
    .map((node) => `${node.tagName}:${textContent(node).trim()}`);

describe("wrapLooseText", () => {
  it("leaves Gutenberg content unchanged", () => {
    const html = "<h2>Title</h2>\n<p>One</p>\n<p>Two</p>";
    expect(topLevel(wrapLooseText(parse(html)))).toEqual([
      "h2:Title",
      "p:One",
      "p:Two",
    ]);
  });

  it("wraps classic-editor paragraphs separated by blank lines", () => {
    const html =
      "<h2>Title</h2>\nFirst <strong>bold</strong> text.\n\n&nbsp;\n<h3>Sub</h3>\nSecond <a href='#'>link</a>.\n\nThird.";
    expect(topLevel(wrapLooseText(parse(html)))).toEqual([
      "h2:Title",
      "p:First bold text.",
      "h3:Sub",
      "p:Second link.",
      "p:Third.",
    ]);
  });

  it("wraps loose text inside wrapper divs", () => {
    const html =
      '<div class="entry-content">\n\nInside one.\n\n<blockquote>Quote</blockquote>\n\nInside two.\n</div>';
    const div = bodyOf(wrapLooseText(parse(html))).children.find(
      isTag,
    ) as Element;
    expect(
      div.children
        .filter(isTag)
        .map((node) => `${node.tagName}:${textContent(node).trim()}`),
    ).toEqual(["p:Inside one.", "blockquote:Quote", "p:Inside two."]);
  });

  it("wraps a wrapper div holding only inline elements", () => {
    const html =
      '<div class="post-share"><span>Some</span> <a href="#">link</a><span>.</span></div>';
    const div = bodyOf(wrapLooseText(parse(html))).children.find(
      isTag,
    ) as Element;
    expect(
      div.children
        .filter(isTag)
        .map((node) => `${node.tagName}:${textContent(node).trim()}`),
    ).toEqual(["p:Some link."]);
  });

  it("does not wrap inline elements without text", () => {
    const html = "<p>One</p>\n<span></span>\n<p>Two</p>";
    expect(topLevel(wrapLooseText(parse(html)))).toEqual([
      "p:One",
      "span:",
      "p:Two",
    ]);
  });

  it("keeps sibling links consistent", () => {
    const body = bodyOf(wrapLooseText(parse("A\n\nB\n\nC")));
    body.children.forEach((child, index) => {
      expect(child.parent).toBe(body);
      expect(child.prev).toBe(body.children[index - 1] ?? null);
      expect(child.next).toBe(body.children[index + 1] ?? null);
    });
  });
});
