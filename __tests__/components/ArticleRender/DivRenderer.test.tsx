import { describe, expect, it, jest } from "@jest/globals";
import type { InternalRendererProps, TBlock } from "@native-html/render";
import { render } from "@testing-library/react-native";

import DivRenderer from "#/screens/Home/components/article/renderer/DivRenderer";

jest.mock("@native-html/render", () => {
  const ReactInFactory = require("react");
  const { View } = require("react-native");
  return {
    useInternalRenderer: () => ({
      rendererProps: { style: { color: "inherited" } },
      Renderer: ({ style }: any) =>
        ReactInFactory.createElement(View, { testID: "div", style }),
    }),
  };
});

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: { light: { surface: "#EEE" }, dark: { surface: "#333" } },
}));

const makeProps = (className?: string): InternalRendererProps<TBlock> =>
  ({
    tnode: { attributes: { class: className } },
  }) as unknown as InternalRendererProps<TBlock>;

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]));

describe("DivRenderer", () => {
  it("renders an ordinary div unchanged", async () => {
    const { getByTestId } = await render(
      DivRenderer(makeProps("wp-block-embed__wrapper")) as React.ReactElement,
    );
    expect(flattenStyle(getByTestId("div").props.style)).toEqual({
      color: "inherited",
    });
  });

  it("renders a div with no class unchanged", async () => {
    const { getByTestId } = await render(
      DivRenderer(makeProps(undefined)) as React.ReactElement,
    );
    expect(flattenStyle(getByTestId("div").props.style)).toEqual({
      color: "inherited",
    });
  });

  it("gives mkk-about / mkk-pillar-link a surface-tinted note box", async () => {
    for (const className of ["mkk-about", "mkk-pillar-link"]) {
      const { getByTestId } = await render(
        DivRenderer(makeProps(className)) as React.ReactElement,
      );
      const style = flattenStyle(getByTestId("div").props.style);
      expect(style.backgroundColor).toBe("#EEE");
      expect(style.borderRadius).toBeGreaterThan(0);
      expect(style.alignSelf).toBeUndefined();
    }
  });

  it("gives mkk-label a self-sized pill, not a full-width box", async () => {
    const { getByTestId } = await render(
      DivRenderer(makeProps("mkk-label")) as React.ReactElement,
    );
    const style = flattenStyle(getByTestId("div").props.style);
    expect(style.backgroundColor).toBe("#EEE");
    expect(style.alignSelf).toBe("flex-start");
  });
});
