import { render } from "@testing-library/react-native";

import UiDivider from "#/components/ui/UiDivider";

type RenderedNode = {
  props: Record<string, unknown>;
  children?: RenderedNode[] | null;
};

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style);
  return style as Record<string, unknown>;
}

describe("UiDivider", () => {
  it("renders correctly and applies padding/width/style props", () => {
    const { toJSON } = render(
      <UiDivider
        paddingHorizontal={12}
        thickness={4}
        style={{ marginVertical: 8 }}
      />,
    );

    const tree = toJSON() as RenderedNode;
    expect(tree).toBeTruthy();

    const containerStyle = flattenStyle(tree.props.style);
    expect(containerStyle.width).toBe("100%");
    expect(containerStyle.paddingHorizontal).toBe(12);
    expect(containerStyle.marginVertical).toBe(8);

    const lineNode = tree.children?.[0];
    expect(lineNode).toBeTruthy();
    const lineStyle = flattenStyle(lineNode!.props.style);
    expect(lineStyle.height).toBe(4);
  });

  it("matches snapshot", () => {
    const { toJSON } = render(
      <UiDivider
        paddingHorizontal={12}
        thickness={4}
        style={{ marginVertical: 8 }}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
