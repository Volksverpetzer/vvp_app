import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";

import InstaPostImage from "#/components/posts/insta/InstaPostImage";
import { spacing } from "#/constants/Spacing";

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  useSharedValue: jest.fn((v: number) => ({ value: v })),
  useAnimatedStyle: jest.fn((fn: () => unknown) => fn()),
  useAnimatedScrollHandler: jest.fn(() => () => {}),
  interpolate: jest.fn(() => 1),
  Extrapolation: { CLAMP: "clamp" },
  default: {
    View: require("react-native").View,
    ScrollView: require("react-native").ScrollView,
  },
}));

jest.mock("@likashefqet/react-native-image-zoom", () => {
  const { View } = require("react-native");
  return {
    Zoomable: ({ children }: { children: unknown }) => <View>{children}</View>,
  };
});

const baseProps = {
  width: 300,
  corporate: "#123456",
  id: "post-1",
  onLongPress: jest.fn(),
};

const flatten = (style: unknown): Record<string, unknown> => {
  const parts = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...parts.filter(Boolean));
};

describe("InstaPostImage", () => {
  it("renders one pressable per photo", async () => {
    const { getAllByRole } = await render(
      <InstaPostImage {...baseProps} photos={["a.jpg", "b.jpg", "c.jpg"]} />,
    );
    expect(getAllByRole("button")).toHaveLength(3);
  });

  it("does not render pagination dots for a single photo", async () => {
    const { queryAllByTestId, toJSON } = await render(
      <InstaPostImage {...baseProps} photos={["a.jpg"]} />,
    );
    expect(queryAllByTestId).toBeDefined();
    // No second row of small square dot views beyond the single photo button.
    const json = JSON.stringify(toJSON());
    expect(json.match(/"borderRadius":5/g)).toBeNull();
  });

  it("renders one pagination dot per photo for a multi-photo carousel", async () => {
    const { toJSON } = await render(
      <InstaPostImage {...baseProps} photos={["a.jpg", "b.jpg", "c.jpg"]} />,
    );
    const json = JSON.stringify(toJSON());
    expect(json.match(/"borderRadius":5/g)).toHaveLength(3);
  });

  // Regression guard: each dot used to carry its own marginHorizontal, where
  // two adjacent dots' margins summed to the real gap (4+4=8). That was
  // flipped to a single `gap` on the dots row — reusing the old per-dot
  // value directly (spacing.xs) would have silently halved the on-screen
  // spacing between dots. See this PR.
  it("keeps the dots-row gap sized to replace the old doubled per-dot margin", async () => {
    const { toJSON } = await render(
      <InstaPostImage {...baseProps} photos={["a.jpg", "b.jpg"]} />,
    );

    const findDotsRow = (node: any): any => {
      if (!node) return undefined;
      const style = flatten(node.props?.style);
      if (style.flexDirection === "row" && "gap" in style) return node;
      for (const child of node.children ?? []) {
        if (typeof child !== "object") continue;
        const found = findDotsRow(child);
        if (found) return found;
      }
      return undefined;
    };

    const dotsRow = findDotsRow(toJSON());
    expect(dotsRow).toBeDefined();
    expect(flatten(dotsRow.props.style).gap).toBe(spacing.sm);
  });
});
