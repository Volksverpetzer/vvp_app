import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { ChevronIcon } from "#/components/Icons";
import UiCollapsable from "#/components/ui/UiCollapsable";

jest.mock("#/components/Icons", () => ({
  ChevronIcon: jest.fn(() => null),
}));

const chevron = ChevronIcon as jest.Mock;

describe("UiCollapsable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("title and icon", () => {
    it("renders the title", async () => {
      const { getByText } = await render(<UiCollapsable title="FAQ" />);
      expect(getByText("FAQ")).toBeTruthy();
    });

    it("renders an optional icon", async () => {
      const { getByText } = await render(
        <UiCollapsable title="FAQ" icon={<Text>icon</Text>} />,
      );
      expect(getByText("icon")).toBeTruthy();
    });
  });

  describe("collapsed state (default)", () => {
    it("hides children", async () => {
      const { queryByText } = await render(
        <UiCollapsable title="FAQ">
          <Text>hidden content</Text>
        </UiCollapsable>,
      );
      expect(queryByText("hidden content")).toBeNull();
    });

    it("shows chevron pointing down", async () => {
      await render(<UiCollapsable title="FAQ" />);
      const lastCall = chevron.mock.calls[chevron.mock.calls.length - 1];
      expect((lastCall[0] as any).direction).toBe("down");
    });

    it("has no background color", async () => {
      const { toJSON } = await render(<UiCollapsable title="FAQ" />);
      const root = toJSON() as any;
      const styles = [root.props.style].flat();
      expect(styles.every((s: any) => !s?.backgroundColor)).toBe(true);
    });
  });

  describe("defaultOpen", () => {
    it("shows children", async () => {
      const { getByText } = await render(
        <UiCollapsable title="FAQ" defaultOpen>
          <Text>visible content</Text>
        </UiCollapsable>,
      );
      expect(getByText("visible content")).toBeTruthy();
    });

    it("shows chevron pointing up", async () => {
      await render(<UiCollapsable title="FAQ" defaultOpen />);
      const lastCall = chevron.mock.calls[chevron.mock.calls.length - 1];
      expect((lastCall[0] as any).direction).toBe("up");
    });

    it("applies a background color", async () => {
      const { toJSON } = await render(
        <UiCollapsable title="FAQ" defaultOpen />,
      );
      const root = toJSON() as any;
      // backgroundColor lives on the Animated.View overlay (first child), not the root View
      const overlay = root.children[0];
      const styles = [overlay.props.style].flat();
      expect(styles.some((s: any) => s?.backgroundColor)).toBe(true);
    });
  });

  describe("toggling", () => {
    it("expands on press and shows chevron up", async () => {
      const { getByRole, getByText } = await render(
        <UiCollapsable title="FAQ">
          <Text>now visible</Text>
        </UiCollapsable>,
      );
      await fireEvent.press(getByRole("button"));
      expect(getByText("now visible")).toBeTruthy();
      const lastCall = chevron.mock.calls[chevron.mock.calls.length - 1];
      expect((lastCall[0] as any).direction).toBe("up");
    });

    it("collapses after a second press", async () => {
      const { getByRole, queryByText } = await render(
        <UiCollapsable title="FAQ">
          <Text>content</Text>
        </UiCollapsable>,
      );
      await fireEvent.press(getByRole("button"));
      await fireEvent.press(getByRole("button"));
      expect(queryByText("content")).toBeNull();
    });

    it("calls onToggle with alternating values", async () => {
      const onToggle = jest.fn();
      const { getByRole } = await render(
        <UiCollapsable title="FAQ" onToggle={onToggle} />,
      );
      await fireEvent.press(getByRole("button"));
      await fireEvent.press(getByRole("button"));
      expect(onToggle).toHaveBeenCalledTimes(2);
      expect(onToggle).toHaveBeenNthCalledWith(1, true);
      expect(onToggle).toHaveBeenNthCalledWith(2, false);
    });

    it("does not throw without an onToggle handler", async () => {
      const { getByRole } = await render(<UiCollapsable title="FAQ" />);
      expect(
        async () => await fireEvent.press(getByRole("button")),
      ).not.toThrow();
    });
  });
});
