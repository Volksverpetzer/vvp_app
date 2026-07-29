import { render } from "@testing-library/react-native";
import type { RefObject } from "react";
import React from "react";
import RenderHtml from "react-native-render-html";

import HeaderRenderer from "#/screens/Home/components/article/renderer/HeaderRenderer";

// Real WordPress block markup: table-of-contents anchors target ids on
// h2 AND h3 wp-block-heading elements (e.g. /analyse/afd-fraktion-extrem/).
const html = `
<h2 class="wp-block-heading" id="Extremismus">Vom Verdachtsfall zu gesichert rechtsextrem</h2>
<p>Text</p>
<h3 class="wp-block-heading" id="Erfurter-Resolution">Die Erfurter Resolution</h3>
<h3 class="wp-block-heading" id="Flügel">Der Flügel</h3>
<h3 class="wp-block-heading">Ohne Anker</h3>
`;

// Mirrors how Body.tsx wires the heading renderers.
const renderHeadings = (componentRefs: RefObject<Record<string, unknown>>) =>
  render(
    <RenderHtml
      source={{ html }}
      contentWidth={400}
      renderers={{
        h2: (renderProperties) =>
          HeaderRenderer({ ...renderProperties, componentRefs }),
        h3: (renderProperties) =>
          HeaderRenderer({ ...renderProperties, componentRefs }),
      }}
    />,
  );

describe("header anchor registration", () => {
  it("registers refs for h2 and h3 ids so ToC and deep-link anchors resolve", async () => {
    const componentRefs = { current: {} as Record<string, unknown> };

    await renderHeadings(componentRefs);

    expect(Object.keys(componentRefs.current)).toEqual([
      "Extremismus",
      "Erfurter-Resolution",
      "Flügel",
    ]);
  });

  it("still renders the heading text for both levels", async () => {
    const componentRefs = { current: {} as Record<string, unknown> };

    const { getByText } = await renderHeadings(componentRefs);

    expect(
      getByText("Vom Verdachtsfall zu gesichert rechtsextrem"),
    ).toBeTruthy();
    expect(getByText("Die Erfurter Resolution")).toBeTruthy();
    expect(getByText("Ohne Anker")).toBeTruthy();
  });
});
