import type { ChildNode, Document, ParentNode } from "domhandler";
import { Element, Text, isTag, isText } from "domhandler";
import { textContent } from "domutils";

import { BLOCK_TAGS } from "./bodyChunks";

/**
 * Containers whose loose text is wrapped as well. Old classic-editor posts
 * nest bare paragraphs in theme wrapper divs (e.g. "entry-content").
 */
const CONTAINER_TAGS = new Set([
  "article",
  "aside",
  "body",
  "div",
  "footer",
  "header",
  "html",
  "main",
  "section",
]);

/** A blank line separates paragraphs, as in WordPress's wpautop. */
const PARAGRAPH_BREAK = /\n\s*\n\s*/;

const isBlock = (node: ChildNode) =>
  isTag(node) &&
  (BLOCK_TAGS.has(node.tagName) ||
    CONTAINER_TAGS.has(node.tagName) ||
    node.tagName === "figcaption" ||
    node.tagName === "li");

const hasVisibleText = (nodes: ChildNode[]) =>
  nodes.some(
    (node) =>
      (isText(node) || (isTag(node) && node.tagName !== "script")) &&
      textContent(node).trim() !== "",
  );

const setChildren = (parent: ParentNode, children: ChildNode[]) => {
  parent.children = children;
  children.forEach((child, index) => {
    child.parent = parent;
    child.prev = children[index - 1] ?? null;
    child.next = children[index + 1] ?? null;
  });
};

const wrapRun = (run: ChildNode[], into: ChildNode[]) => {
  if (!hasVisibleText(run)) {
    into.push(...run);
    return;
  }
  const paragraph = new Element("p", {});
  setChildren(paragraph, run);
  into.push(paragraph);
};

const wrapContainer = (container: ParentNode) => {
  const loose = hasVisibleText(
    container.children.filter((node) => !isBlock(node)),
  );
  if (loose) {
    const children: ChildNode[] = [];
    let run: ChildNode[] = [];
    for (const node of container.children) {
      if (isBlock(node)) {
        wrapRun(run, children);
        run = [];
        children.push(node);
      } else if (isText(node) && PARAGRAPH_BREAK.test(node.data)) {
        const parts = node.data.split(PARAGRAPH_BREAK);
        parts.forEach((part, index) => {
          if (part !== "") run.push(new Text(part));
          if (index < parts.length - 1) {
            wrapRun(run, children);
            run = [];
          }
        });
      } else {
        run.push(node);
      }
    }
    wrapRun(run, children);
    setChildren(container, children);
  }
  for (const child of container.children) {
    if (isTag(child) && CONTAINER_TAGS.has(child.tagName)) {
      wrapContainer(child);
    }
  }
};

/**
 * Wraps loose top-level text and inline elements into <p> elements.
 * Classic-editor posts (pre-Gutenberg) come out of the REST API without
 * wpautop applied: their paragraphs are bare text separated by blank lines,
 * which would otherwise miss the <p> tag styles (font size, side padding)
 * and render in the engine's small default font flush to the screen edge.
 * Gutenberg content has no loose text and is returned unchanged.
 */
export const wrapLooseText = (document: Document): Document => {
  wrapContainer(document);
  return document;
};
