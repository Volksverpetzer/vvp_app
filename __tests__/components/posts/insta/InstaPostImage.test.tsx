import { describe, expect, it, jest } from "@jest/globals";
import { act, render } from "@testing-library/react-native";
import { Platform } from "react-native";

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

  const findImageNode = (node: any): any => {
    if (!node) return undefined;
    if (typeof node.props?.onLoad === "function") return node;
    for (const child of node.children ?? []) {
      if (typeof child !== "object") continue;
      const found = findImageNode(child);
      if (found) return found;
    }
    return undefined;
  };

  it("keeps the fallback ratio when onLoad reports a zero-width image, instead of an invalid aspectRatio", async () => {
    const { toJSON } = await render(
      <InstaPostImage {...baseProps} photos={["a.jpg"]} inView />,
    );

    const before = flatten(findImageNode(toJSON()).props.style);
    expect(Number.isFinite(before.aspectRatio)).toBe(true);

    // Awaited: a sync act() here left the state update pending past this
    // test's end, bleeding into the next test's render (its toJSON() came
    // back null).
    await act(async () => {
      findImageNode(toJSON()).props.onLoad({
        nativeEvent: { source: { width: 0, height: 400 } },
      });
      await Promise.resolve();
    });

    const after = flatten(findImageNode(toJSON()).props.style);
    expect(after.aspectRatio).toBe(before.aspectRatio);
  });

  const findScrollViewNode = (node: any): any => {
    if (!node) return undefined;
    if (node.props?.pagingEnabled) return node;
    for (const child of node.children ?? []) {
      if (typeof child !== "object") continue;
      const found = findScrollViewNode(child);
      if (found) return found;
    }
    return undefined;
  };

  // Regression guard: a trackpad's diagonal swipe carries both deltaX and
  // deltaY — without suppressing the vertical component when the gesture is
  // horizontally dominant, the page scrolls at the same time the slider
  // does, making the image wobble vertically while swiping through it. See
  // this PR.
  it("prevents the page from scrolling on a horizontally-dominant wheel gesture, on web with multiple photos", async () => {
    const platform = jest.replaceProperty(Platform, "OS", "web");
    try {
      const { toJSON } = await render(
        <InstaPostImage {...baseProps} photos={["a.jpg", "b.jpg"]} />,
      );
      const scrollView = findScrollViewNode(toJSON());
      const preventDefault = jest.fn();
      scrollView.props.onWheel({ deltaX: 20, deltaY: 5, preventDefault });
      expect(preventDefault).toHaveBeenCalled();

      preventDefault.mockClear();
      scrollView.props.onWheel({ deltaX: 5, deltaY: 20, preventDefault });
      expect(preventDefault).not.toHaveBeenCalled();
    } finally {
      platform.restore();
    }
  });

  it("does not wire a wheel handler on native, or for a single-photo carousel on web", async () => {
    const { toJSON: nativeJSON } = await render(
      <InstaPostImage {...baseProps} photos={["a.jpg", "b.jpg"]} />,
    );
    expect(findScrollViewNode(nativeJSON()).props.onWheel).toBeUndefined();

    const platform = jest.replaceProperty(Platform, "OS", "web");
    try {
      const { toJSON: singlePhotoJSON } = await render(
        <InstaPostImage {...baseProps} photos={["a.jpg"]} />,
      );
      expect(
        findScrollViewNode(singlePhotoJSON()).props.onWheel,
      ).toBeUndefined();
    } finally {
      platform.restore();
    }
  });

  const findExpoImageNode = (node: any): any => {
    if (!node) return undefined;
    if (node.type === "ViewManagerAdapter_ExpoImage") return node;
    for (const child of node.children ?? []) {
      if (typeof child !== "object") continue;
      const found = findExpoImageNode(child);
      if (found) return found;
    }
    return undefined;
  };

  // Regression guard: Cache-Control isn't CORS-safelisted, so sending it on
  // web forces a preflight the media proxy doesn't answer and the image
  // silently never loads. See this PR.
  it("omits the Cache-Control source header on web but keeps it on native", async () => {
    const { toJSON } = await render(
      <InstaPostImage {...baseProps} photos={["native.jpg"]} inView />,
    );
    expect(findExpoImageNode(toJSON()).props.source[0].headers).toEqual({
      "Cache-Control": "max-age=604000",
    });

    const platform = jest.replaceProperty(Platform, "OS", "web");
    try {
      const { toJSON: toJSONWeb } = await render(
        <InstaPostImage {...baseProps} photos={["web.jpg"]} inView />,
      );
      expect(
        findExpoImageNode(toJSONWeb()).props.source[0].headers,
      ).toBeUndefined();
    } finally {
      platform.restore();
    }
  });
});
