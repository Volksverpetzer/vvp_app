import { render as serialize } from "dom-serializer";
import type { Element } from "domhandler";
import { parseDocument } from "htmlparser2";

// Real domutils/domhandler (not the mocked module some sibling test files
// use) — the unwrap logic's correctness depends on domutils' actual
// `append`/`removeElement` linked-list semantics, which a jest.fn() mock
// can't exercise.
import { handleContainerElements } from "#/screens/Home/components/article/ElementHandlers";

// Parses `html` wrapped in a `<div class="wrap">`, runs `handleContainerElements`
// on every `div`/`figure` inside it (innermost first, matching how
// @native-html/render's domVisitors.onElement walks the tree during Body's
// article rendering), and returns the wrapper's serialized inner HTML.
const runUnwrap = (html: string): string => {
  const doc = parseDocument(`<div class="wrap">${html}</div>`);
  const wrap = doc.children[0] as Element;

  // Collects every descendant div/figure (never `wrap` itself, which only
  // exists to give the fixture HTML a single root and must survive so the
  // test can read its children back out afterwards).
  const collectContainers = (element: Element): Element[] =>
    element.children.flatMap((child) => {
      if (!("tagName" in child)) return [];
      const childElement = child as Element;
      const nested = collectContainers(childElement);
      const self =
        childElement.tagName === "div" || childElement.tagName === "figure"
          ? [childElement]
          : [];
      return [...nested, ...self];
    });

  // Innermost-first so a parent box's own child count is evaluated after
  // its children have already been (possibly) unwrapped, same order the
  // real HTML renderer's DOM visitor processes elements in.
  for (const container of collectContainers(wrap)) {
    handleContainerElements(container);
  }

  return serialize(wrap.children);
};

describe("handleContainerElements — unwrapping real DOM nodes", () => {
  it("keeps a wrapper div's plain text instead of deleting it", () => {
    // A `<div>` whose only child is a text node (no nested tag) — the
    // pattern Mimikama's theme uses for labeled callout/comparison boxes,
    // e.g. `<div class="mk-vgl__item">„Wie kann man nur so dumm sein?“</div>`.
    const result = runUnwrap('<div class="mk-vgl__item">Item text</div>');
    expect(result).toBe("Item text");
  });

  it("preserves surrounding text and the unwrapped div's own text, in order", () => {
    const result = runUnwrap(
      'before<div class="mk-vgl__item">middle</div>after',
    );
    expect(result).toBe("beforemiddleafter");
  });

  it("preserves the original order of multiple tag children", () => {
    // <a> tags aren't div/figure, so they're inert to handleContainerElements
    // themselves — only the wrapping div (2 children, no important class)
    // gets unwrapped, isolating order-preservation from the recursive
    // text-collapse the other tests exercise. Before the fix, repeatedly
    // appending after the same fixed anchor reversed this order.
    const result = runUnwrap(
      '<div class="mk-vgl__col"><a href="#">First</a><a href="#">Second</a></div>',
    );
    expect(result).toBe('<a href="#">First</a><a href="#">Second</a>');
  });

  it("still preserves WordPress blocks and figures with captions", () => {
    expect(runUnwrap('<div class="wp-block-embed">kept</div>')).toBe(
      '<div class="wp-block-embed">kept</div>',
    );
    expect(
      runUnwrap(
        '<figure><img src="a.jpg"/><figcaption>caption</figcaption></figure>',
      ),
    ).toBe(
      '<figure><img src="a.jpg"><figcaption>caption</figcaption></figure>',
    );
  });

  it("leaves a div with more than 2 children in place", () => {
    // Children are <a> tags — handleContainerElements only ever acts on
    // div/figure, so they can't be unwrapped themselves; this isolates the
    // `children.length <= 2` gate on the outer div from the recursive
    // unwrapping the other tests exercise.
    const html =
      '<div class="mk-box"><a href="#">One</a><a href="#">Two</a><a href="#">Three</a></div>';
    expect(runUnwrap(html)).toBe(html);
  });
});
