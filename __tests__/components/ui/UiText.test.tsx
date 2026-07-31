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
  it("applies size and weight from a variant", async () => {
    const style = await styleOf(<UiText variant="title">Titel</UiText>);

    expect(style.fontSize).toBe(fontSizes.xxl);
    expect(style.fontFamily).toBe("SourceSansProBold");
    expect(style.color).toBe(Colors.light.text);
  });

  it("applies the muted tone for meta text", async () => {
    const style = await styleOf(
      <UiText variant="meta">Autor | 1.1.2026</UiText>,
    );

    expect(style.fontSize).toBe(fontSizes.sm);
    expect(style.fontFamily).toBe("SourceSansPro");
    expect(style.color).toBe(Colors.light.textMuted);
  });

  it("lets explicit props and styles override the variant", async () => {
    const style = await styleOf(
      <UiText
        variant="title"
        size="sm"
        bold={false}
        style={{ color: "#ff0000" }}
      >
        Titel
      </UiText>,
    );

    expect(style.fontSize).toBe(fontSizes.sm);
    expect(style.fontFamily).toBe("SourceSansPro");
    expect(style.color).toBe("#ff0000");
  });

  it("falls back to the default text color without a variant", async () => {
    const style = await styleOf(<UiText size="base">Text</UiText>);

    expect(style.fontSize).toBe(fontSizes.base);
    expect(style.color).toBe(Colors.light.text);
  });
});
