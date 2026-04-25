import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";
import type { InternalRendererProps, TText } from "react-native-render-html";

import EmRenderer from "#/screens/Home/components/article/renderer/EmRenderer";

jest.mock("react-native-render-html", () => {
  const ReactInFactory = require("react");
  const { View } = require("react-native");
  return {
    useInternalRenderer: () => ({
      rendererProps: { style: {} },
      Renderer: ({ style }: any) =>
        ReactInFactory.createElement(View, { testID: "em-text", style }),
    }),
  };
});

const makeProps = (parentFontFamily?: string): InternalRendererProps<TText> =>
  ({
    tnode: {
      parent: parentFontFamily
        ? { styles: { nativeTextFlow: { fontFamily: parentFontFamily } } }
        : null,
    },
  }) as unknown as InternalRendererProps<TText>;

const getFontFamily = (style: unknown): string | undefined => {
  const styles = Array.isArray(style) ? style : [style];
  return styles.map((s: any) => s?.fontFamily).find(Boolean);
};

describe("EmRenderer font family", () => {
  it("uses SourceSansProBoldItalic when parent is SourceSansProBold", () => {
    const { getByTestId } = render(
      EmRenderer(makeProps("SourceSansProBold")) as React.ReactElement,
    );
    expect(getFontFamily(getByTestId("em-text").props.style)).toBe(
      "SourceSansProBoldItalic",
    );
  });

  it("uses SourceSansProItalic when parent has a non-bold font", () => {
    const { getByTestId } = render(
      EmRenderer(makeProps("SourceSansPro")) as React.ReactElement,
    );
    expect(getFontFamily(getByTestId("em-text").props.style)).toBe(
      "SourceSansProItalic",
    );
  });

  it("uses SourceSansProItalic when parent has no font family", () => {
    const { getByTestId } = render(
      EmRenderer(makeProps()) as React.ReactElement,
    );
    expect(getFontFamily(getByTestId("em-text").props.style)).toBe(
      "SourceSansProItalic",
    );
  });
});
