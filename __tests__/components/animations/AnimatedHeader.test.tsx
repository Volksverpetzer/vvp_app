import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Animated, Text } from "react-native";

import AnimatedHeader from "#/components/animations/AnimatedHeader";
import { CONTENT_MAX_WIDTH } from "#/constants/GlobalStyles";
import { layers } from "#/constants/Layers";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const flatten = (style: unknown): Record<string, unknown> => {
  const parts = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...parts.filter(Boolean));
};

const scrollOffsetY = () => new Animated.Value(0);

describe("AnimatedHeader", () => {
  it("renders a string title", async () => {
    const { getByText } = await render(
      <AnimatedHeader
        title="Einstellungen"
        scrollOffsetY={scrollOffsetY()}
        minHeight={50}
        maxHeight={150}
      />,
    );
    expect(getByText("Einstellungen")).toBeTruthy();
  });

  it("renders a node title as-is instead of wrapping it in Animated.Text", async () => {
    const { getByText } = await render(
      <AnimatedHeader
        title={<Text>Custom title</Text>}
        scrollOffsetY={scrollOffsetY()}
        minHeight={50}
        maxHeight={150}
      />,
    );
    expect(getByText("Custom title")).toBeTruthy();
  });

  it("renders children below the title", async () => {
    const { getByText } = await render(
      <AnimatedHeader
        scrollOffsetY={scrollOffsetY()}
        minHeight={50}
        maxHeight={150}
      >
        <Text>Search bar</Text>
      </AnimatedHeader>,
    );
    expect(getByText("Search bar")).toBeTruthy();
  });

  it("navigates to /support when the heart icon is pressed", async () => {
    const { getByRole } = await render(
      <AnimatedHeader
        scrollOffsetY={scrollOffsetY()}
        minHeight={50}
        maxHeight={150}
      />,
    );
    await fireEvent.press(getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/support");
  });

  it("hides the heart icon when hideSupportHeart is set", async () => {
    const { queryByRole } = await render(
      <AnimatedHeader
        hideSupportHeart
        scrollOffsetY={scrollOffsetY()}
        minHeight={50}
        maxHeight={150}
      />,
    );
    expect(queryByRole("button")).toBeNull();
  });

  // Regression guard: the collapsing header container used to sit at
  // zIndex 999 (with the title text at zIndex 100 above its own background)
  // before the z-index scale collapsed local stacking bumps onto shared
  // tiers. It must stay the highest tier used by this component so it keeps
  // covering scrolled-under content, and strictly above the title's own
  // tier. See src/constants/Layers.ts and this PR.
  it("keeps the header container above the title in the z-index scale", async () => {
    const { toJSON } = await render(
      <AnimatedHeader
        title="Einstellungen"
        scrollOffsetY={scrollOffsetY()}
        minHeight={50}
        maxHeight={150}
      />,
    );
    const root = toJSON() as any;
    expect(flatten(root.props.style).zIndex).toBe(layers.sticky);

    const findTitle = (node: any): any => {
      if (!node) return undefined;
      if (flatten(node.props?.style).zIndex === layers.raised) return node;
      for (const child of node.children ?? []) {
        if (typeof child !== "object") continue;
        const found = findTitle(child);
        if (found) return found;
      }
      return undefined;
    };
    expect(findTitle(root)).toBeDefined();
    expect(layers.sticky).toBeGreaterThan(layers.raised);
  });

  // Regression guard: the children wrapper had no alignSelf, so under the
  // gradient container's default `alignItems: "center"` it shrank to its
  // content's width instead of the header's width — visible on web as a
  // search bar that didn't span the header (a `width: "100%"` child
  // resolves against this wrapper, so the wrapper itself must stretch).
  // Fixing that by stretching to the full window overshot too — the wrapper
  // must cap at the feed's own content column width, not the raw window.
  // See this PR.
  it("caps the children wrapper at the feed's content-column width, stretched to fill up to it", async () => {
    const { getByText } = await render(
      <AnimatedHeader
        scrollOffsetY={scrollOffsetY()}
        minHeight={50}
        maxHeight={150}
      >
        <Text>Search bar</Text>
      </AnimatedHeader>,
    );

    let node = getByText("Search bar").parent;
    while (node && flatten(node.props?.style).alignSelf !== "stretch") {
      node = node.parent;
    }
    expect(node).toBeTruthy();
    expect(flatten(node.props.style).maxWidth).toBe(CONTENT_MAX_WIDTH);
  });
});
