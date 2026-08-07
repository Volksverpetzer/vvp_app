import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import type { BadgePosition } from "#/components/posts/Badge";
import Badge, { MIN_TOUCH_TARGET } from "#/components/posts/Badge";
import { radii } from "#/constants/BorderRadius";

const flatten = (style: unknown): Record<string, unknown> => {
  const parts = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...parts.filter(Boolean));
};

const styleOf = (tree: any) => flatten(tree.props.style);

describe("Badge", () => {
  it("renders children", async () => {
    const { getByText } = await render(
      <Badge position="topLeft" color="red">
        <Text>NEU</Text>
      </Badge>,
    );
    expect(getByText("NEU")).toBeTruthy();
  });

  it("applies the badge colour", async () => {
    const { toJSON } = await render(
      <Badge position="topLeft" color="rebeccapurple">
        <Text>x</Text>
      </Badge>,
    );
    expect(styleOf(toJSON()).backgroundColor).toBe("rebeccapurple");
  });

  // The badge sits flush in a corner of its parent image: the two edges that
  // touch the image stay square, and only the corner pointing inward is
  // rounded. Getting this wrong leaves a visible notch over the artwork.
  describe.each([
    ["topLeft", { top: 0, left: 0 }, "borderBottomRightRadius"],
    ["topRight", { top: 0, right: 0 }, "borderBottomLeftRadius"],
    ["bottomLeft", { bottom: 0, left: 0 }, "borderTopRightRadius"],
    ["bottomRight", { bottom: 0, right: 0 }, "borderTopLeftRadius"],
  ] as [BadgePosition, Record<string, number>, string][])(
    "position %s",
    (position, anchor, roundedCorner) => {
      it("anchors to its corner and rounds only the inward corner", async () => {
        const { toJSON } = await render(
          <Badge position={position} color="red">
            <Text>x</Text>
          </Badge>,
        );
        const style = styleOf(toJSON());

        expect(style.position).toBe("absolute");
        for (const [edge, value] of Object.entries(anchor)) {
          expect(style[edge]).toBe(value);
        }

        expect(style[roundedCorner]).toBe(radii.xs);
        const allCorners = [
          "borderTopLeftRadius",
          "borderTopRightRadius",
          "borderBottomLeftRadius",
          "borderBottomRightRadius",
        ];
        for (const corner of allCorners.filter((c) => c !== roundedCorner)) {
          expect(style[corner]).toBeUndefined();
        }
      });
    },
  );

  describe("when onPress is given", () => {
    it("exposes a labelled button and calls onPress", async () => {
      const onPress = jest.fn();
      const { getByRole } = await render(
        <Badge
          position="topRight"
          color="red"
          onPress={onPress}
          accessibilityLabel="Merken"
        >
          <Text>x</Text>
        </Badge>,
      );
      const button = getByRole("button", { name: "Merken" });
      await fireEvent.press(button);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("grows to the minimum touch target without moving the glyph off its corner", async () => {
      const { getByRole } = await render(
        <Badge position="bottomLeft" color="red" onPress={jest.fn()}>
          <Text>x</Text>
        </Badge>,
      );
      const style = flatten(getByRole("button").props.style);
      expect(style.minWidth).toBe(MIN_TOUCH_TARGET);
      expect(style.minHeight).toBe(MIN_TOUCH_TARGET);
      // bottomLeft: the touch target expands up and to the right, so the glyph
      // stays pinned to the bottom-left corner.
      expect(style.alignItems).toBe("flex-start");
      expect(style.justifyContent).toBe("flex-end");
    });

    it("keeps the corner rounding of the static badge", async () => {
      const { getByRole } = await render(
        <Badge position="topLeft" color="red" onPress={jest.fn()}>
          <Text>x</Text>
        </Badge>,
      );
      const style = flatten(getByRole("button").props.style);
      expect(style.borderBottomRightRadius).toBe(radii.xs);
    });
  });

  it("renders a plain View with no button role when onPress is omitted", async () => {
    const { queryByRole } = await render(
      <Badge position="topLeft" color="red">
        <Text>x</Text>
      </Badge>,
    );
    expect(queryByRole("button")).toBeNull();
  });
});
