import { defaultHTMLElementModels } from "@native-html/render";
import TRenderEngine from "@native-html/transient-render-engine";
import type { Document } from "domhandler";
import { isTag } from "domhandler";

import { handleSpecialElements } from "#/screens/Home/components/article/ElementHandlers";
import {
  chunkIndexOfId,
  splitIntoChunks,
} from "#/screens/Home/components/article/bodyChunks";

const engine = new TRenderEngine({
  customizeHTMLModels: (models) =>
    ({
      ...models,
      figcaption: defaultHTMLElementModels.p,
      figure: defaultHTMLElementModels.div,
    }) as unknown as typeof models,
  domVisitors: {
    onElement: (element) => {
      handleSpecialElements(element as never);
    },
  },
});

const parse = (html: string) =>
  engine.parseDocument(html) as unknown as Document;

const topLevelTags = (chunk: Document) => {
  const body = chunk.children[0];
  return isTag(body)
    ? body.children.filter(isTag).map((node) => node.tagName)
    : [];
};

const paragraphs = (count: number, from = 0) =>
  Array.from({ length: count }, (_, index) => `<p>P${from + index}</p>`).join(
    "\n",
  );

describe("splitIntoChunks", () => {
  it("keeps a short body in one chunk", () => {
    const document = parse(paragraphs(5));
    const chunks = splitIntoChunks(document, 10, 10);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(document);
  });

  it("splits a long body into a small first chunk and larger later ones", () => {
    const chunks = splitIntoChunks(parse(paragraphs(25)), 3, 10);
    expect(chunks.map((chunk) => topLevelTags(chunk).length)).toEqual([
      3, 10, 10, 2,
    ]);
  });

  it("never splits a run of top-level inline content", () => {
    const html = `${paragraphs(3)}\n<a href="#">link</a> loose text <strong>bold</strong>\n${paragraphs(3, 3)}`;
    const chunks = splitIntoChunks(parse(html), 1, 1);
    const tags = chunks.map(topLevelTags);
    // The inline run stays with the block before it; the block after it
    // can't start a chunk either, since the run precedes it.
    expect(tags).toEqual([
      ["p"],
      ["p"],
      ["p", "a", "strong", "p"],
      ["p"],
      ["p"],
    ]);
  });

  it("keeps a moved figcaption with its figure", () => {
    const html = `<p>A</p><figure><img src="https://x.test/a.png"></figure><figure><img src="https://x.test/b.png"><figcaption>Caption</figcaption></figure><p>B</p>`;
    const tags = splitIntoChunks(parse(html), 1, 1).map(topLevelTags);
    expect(tags).toEqual([["p"], ["figure"], ["figure", "figcaption"], ["p"]]);
  });

  it("produces the same top-level blocks as building the body at once", () => {
    const html = `<h2 id="start">Start</h2>${paragraphs(20)}<blockquote><p>Quote</p></blockquote>text<em>run</em>${paragraphs(20, 20)}<ul><li>x</li></ul>`;
    const whole = engine.buildTTreeFromDoc(parse(html) as never);
    const chunks = splitIntoChunks(parse(html), 5, 7);
    expect(chunks.length).toBeGreaterThan(2);

    const bodyBlocks = (tree: typeof whole) =>
      tree.children.find((child) => child.tagName === "body")!.children;
    const chunked = chunks.flatMap((chunk) =>
      bodyBlocks(engine.buildTTreeFromDoc(chunk as never)),
    );
    const snapshot = (nodes: readonly (typeof chunked)[number][]) =>
      nodes.map((node) => `${node.displayName}:${node.tagName ?? ""}`);
    expect(snapshot(chunked)).toEqual(snapshot(bodyBlocks(whole)));
  });
});

describe("chunkIndexOfId", () => {
  const chunks = splitIntoChunks(
    parse(`${paragraphs(4)}<div><h3 id="deep">Deep</h3></div>${paragraphs(4)}`),
    2,
    2,
  );

  it("finds the chunk containing a (nested) id", () => {
    expect(chunkIndexOfId(chunks, "deep")).toBe(2);
  });

  it("returns -1 for a missing or empty id", () => {
    expect(chunkIndexOfId(chunks, "nope")).toBe(-1);
    expect(chunkIndexOfId(chunks, undefined)).toBe(-1);
  });
});
