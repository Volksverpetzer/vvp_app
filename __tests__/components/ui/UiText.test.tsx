import { render } from "@testing-library/react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { fontSizes } from "#/constants/FontSizes";

type RenderedNode = {
  props: Record<string, unknown>;
};

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style))
    return Object.assign({}, ...style.map(flattenStyle));
  return style as Record<string, unknown>;
}

const styleOf = async (element: React.ReactElement) => {
  const { toJSON } = await render(element);
  const tree = toJSON() as RenderedNode;
  return flattenStyle(tree.props.style);
};

describe("UiText", () => {
  it("applies the font-scale size and default text color", async () => {
    const style = await styleOf(<UiText size="base">Text</UiText>);

    expect(style.fontSize).toBe(fontSizes.base);
    expect(style.fontFamily).toBe("SourceSansPro");
    expect(style.color).toBe(Colors.light.text);
  });

  it("renders bold in the bold font family", async () => {
    const style = await styleOf(
      <UiText bold size="xl">
        Text
      </UiText>,
    );

    expect(style.fontFamily).toBe("SourceSansProBold");
    expect(style.fontSize).toBe(fontSizes.xl);
  });

  it("lets an explicit style color override the default", async () => {
    const style = await styleOf(
      <UiText style={{ color: "#ff0000" }}>Text</UiText>,
    );

    expect(style.color).toBe("#ff0000");
  });
});
