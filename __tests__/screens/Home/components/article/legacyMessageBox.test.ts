import TRenderEngine from "@native-html/transient-render-engine";
import type { Document, Element } from "domhandler";
import { isTag } from "domhandler";
import { textContent } from "domutils";

import { getClassStyles } from "#/helpers/utils/articleTagStyles";
import { ColorScheme } from "#/hooks/useAppColorScheme";
import { handleArticleElement } from "#/screens/Home/components/article/ElementHandlers";
import { wrapLooseText } from "#/screens/Home/components/article/looseText";

// Same DOM pipeline as Body: the element handlers run while parsing, then
// loose text is wrapped into paragraphs.
const engine = new TRenderEngine({
  domVisitors: { onElement: (element) => handleArticleElement(element) },
});

const parse = (html: string) =>
  wrapLooseText(engine.parseDocument(html) as unknown as Document);

const elements = (document: Document | Element): Element[] =>
  document.children
    .filter(isTag)
    .flatMap((node) => [node as Element, ...elements(node as Element)]);

const boxes = (document: Document) =>
  elements(document).filter((node) =>
    node.attribs.class?.includes("vvp-legacy-message"),
  );

const SVG =
  '<svg viewBox="0 0 24 24" width="24" height="24" focusable="false"><circle cx="12" cy="12" r="10.5"/></svg>';

describe("legacy message boxes", () => {
  it("keeps a shortcode box, drops its icon and unwraps its content", () => {
    const document = parse(
      `<p>Vorher</p><div class="vvp-legacy-message vvp-legacy-message--danger foo" role="note"><div class="vvp-legacy-message__icon" aria-hidden="true">${SVG}</div><div class="vvp-legacy-message__content"><p>Update: Eins</p>\n<p>Zwei</p>\n</div></div><p>Nachher</p>`,
    );

    const [box] = boxes(document);
    expect(boxes(document)).toHaveLength(1);
    expect(box.attribs).toEqual({
      class: "vvp-legacy-message vvp-legacy-message--danger",
    });
    expect(
      box.children.filter(isTag).map((node) => (node as Element).tagName),
    ).toEqual(["p", "p"]);
    expect(textContent(box).trim()).toBe("Update: Eins\nZwei");
    expect(elements(document).some((node) => node.tagName === "svg")).toBe(
      false,
    );
  });

  it("keeps a baked box and wraps its loose text into a paragraph", () => {
    const document = parse(
      `<div class="vc_message_box vc_message_box-standard vc_color-danger vvp-legacy-message vvp-legacy-message--baked vvp-legacy-message--danger" role="note"><div class="vc_message_box-icon vvp-legacy-message__icon" aria-hidden="true">${SVG}</div>\n<em>Aber Achtung: Text</em></div>`,
    );

    const [box] = boxes(document);
    expect(box.attribs.class).toBe(
      "vvp-legacy-message vvp-legacy-message--danger",
    );
    const [paragraph] = box.children.filter(isTag) as Element[];
    expect(paragraph.tagName).toBe("p");
    expect(textContent(paragraph).trim()).toBe("Aber Achtung: Text");
  });

  it("falls back to info for an unknown type", () => {
    const document = parse(
      '<div class="vvp-legacy-message vvp-legacy-message--baked"><p>Text</p></div>',
    );
    expect(boxes(document)[0].attribs.class).toBe(
      "vvp-legacy-message vvp-legacy-message--info",
    );
  });

  it("styles every type in both color schemes", () => {
    for (const scheme of [ColorScheme.light, ColorScheme.dark]) {
      const styles = getClassStyles(scheme);
      expect(styles["vvp-legacy-message"].borderLeftWidth).toBe(4);
      for (const type of ["info", "warning", "success", "danger"] as const) {
        const style = styles[`vvp-legacy-message--${type}`];
        expect(style.borderLeftColor).toMatch(/^#[\dA-F]{6}$/i);
        expect(style.backgroundColor).toBe(`${style.borderLeftColor}1A`);
      }
    }
  });
});
