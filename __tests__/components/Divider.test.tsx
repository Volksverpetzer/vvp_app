import { render } from "@testing-library/react-native";

import Divider from "#/components/design/Divider";

function flattenStyle(style: any) {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style);
  return style;
}

describe("Divider", () => {
  it("renders correctly and applies padding/width/style props", () => {
    const { toJSON } = render(
      <Divider
        paddingHorizontal={12}
        thickness={4}
        style={{ marginVertical: 8 }}
      />,
    );

    const tree = toJSON();
    expect(tree).toBeTruthy();

    const containerStyle = flattenStyle(tree.props.style);
    expect(containerStyle.width).toBe("100%");
    expect(containerStyle.paddingLeft).toBe(12);
    expect(containerStyle.paddingRight).toBe(12);
    expect(containerStyle.marginVertical).toBe(8);

    const lineNode = tree.children && tree.children[0];
    expect(lineNode).toBeTruthy();
    const lineStyle = flattenStyle(lineNode.props.style);
    expect(lineStyle.height).toBe(4);
  });

  it("matches snapshot", () => {
    const { toJSON } = render(
      <Divider
        paddingHorizontal={12}
        thickness={4}
        style={{ marginVertical: 8 }}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
