import { render } from "@testing-library/react-native";

import Typography from "#/components/ui/Typography";
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

describe("Typography", () => {
  it("renders a title with the screen-title role", async () => {
    const style = await styleOf(<Typography type="title">Titel</Typography>);

    expect(style.fontSize).toBe(fontSizes.xxl);
    expect(style.fontFamily).toBe("SourceSansProBold");
    expect(style.color).toBe(Colors.light.text);
    expect(style.textAlign).toBe("left");
  });

  it("applies the card-title role's line height", async () => {
    const style = await styleOf(
      <Typography type="cardTitle">Titel</Typography>,
    );

    expect(style.fontSize).toBe(fontSizes.xl);
    expect(style.lineHeight).toBe(26);
  });

  it("renders a muted meta line", async () => {
    const style = await styleOf(
      <Typography type="meta">Autor | 1.1.2026 | 5 Min.</Typography>,
    );

    expect(style.fontSize).toBe(fontSizes.sm);
    expect(style.fontFamily).toBe("SourceSansPro");
    expect(style.color).toBe(Colors.light.textMuted);
  });

  it("lets an explicit style override the role's color", async () => {
    const style = await styleOf(
      <Typography type="meta" style={{ color: "#123456" }}>
        Autor
      </Typography>,
    );

    expect(style.color).toBe("#123456");
  });
});
