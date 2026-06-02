import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { ChevronIcon } from "#/components/Icons";
import UiCollapsable from "#/components/ui/UiCollapsable";

jest.mock("#/components/Icons", () => ({
  ChevronIcon: jest.fn(() => null),
}));

jest.mock("#/components/typography/Heading", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});

const chevron = ChevronIcon as jest.Mock;

describe("UiCollapsable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("title and icon", () => {
    it("renders the title", () => {
      const { getByText } = render(<UiCollapsable title="FAQ" />);
      expect(getByText("FAQ")).toBeTruthy();
    });

    it("renders an optional icon", () => {
      const { getByText } = render(
        <UiCollapsable title="FAQ" icon={<Text>icon</Text>} />,
      );
      expect(getByText("icon")).toBeTruthy();
    });
  });

  describe("collapsed state (default)", () => {
    it("hides children", () => {
      const { queryByText } = render(
        <UiCollapsable title="FAQ">
          <Text>hidden content</Text>
        </UiCollapsable>,
      );
      expect(queryByText("hidden content")).toBeNull();
    });

    it("shows chevron pointing down", () => {
      render(<UiCollapsable title="FAQ" />);
      const lastCall = chevron.mock.calls[chevron.mock.calls.length - 1];
      expect((lastCall[0] as any).direction).toBe("down");
    });

    it("has no background color", () => {
      const { toJSON } = render(<UiCollapsable title="FAQ" />);
      const root = toJSON() as any;
      const styles = [root.props.style].flat();
      expect(styles.every((s: any) => !s?.backgroundColor)).toBe(true);
    });
  });

  describe("defaultOpen", () => {
    it("shows children", () => {
      const { getByText } = render(
        <UiCollapsable title="FAQ" defaultOpen>
          <Text>visible content</Text>
        </UiCollapsable>,
      );
      expect(getByText("visible content")).toBeTruthy();
    });

    it("shows chevron pointing up", () => {
      render(<UiCollapsable title="FAQ" defaultOpen />);
      const lastCall = chevron.mock.calls[chevron.mock.calls.length - 1];
      expect((lastCall[0] as any).direction).toBe("up");
    });

    it("applies a background color", () => {
      const { toJSON } = render(<UiCollapsable title="FAQ" defaultOpen />);
      const root = toJSON() as any;
      // backgroundColor lives on the Animated.View overlay (first child), not the root View
      const overlay = root.children[0];
      const styles = [overlay.props.style].flat();
      expect(styles.some((s: any) => s?.backgroundColor)).toBe(true);
    });
  });

  describe("toggling", () => {
    it("expands on press and shows chevron up", () => {
      const { getByRole, getByText } = render(
        <UiCollapsable title="FAQ">
          <Text>now visible</Text>
        </UiCollapsable>,
      );
      fireEvent.press(getByRole("button"));
      expect(getByText("now visible")).toBeTruthy();
      const lastCall = chevron.mock.calls[chevron.mock.calls.length - 1];
      expect((lastCall[0] as any).direction).toBe("up");
    });

    it("collapses after a second press", () => {
      const { getByRole, queryByText } = render(
        <UiCollapsable title="FAQ">
          <Text>content</Text>
        </UiCollapsable>,
      );
      fireEvent.press(getByRole("button"));
      fireEvent.press(getByRole("button"));
      expect(queryByText("content")).toBeNull();
    });

    it("calls onToggle with alternating values", () => {
      const onToggle = jest.fn();
      const { getByRole } = render(
        <UiCollapsable title="FAQ" onToggle={onToggle} />,
      );
      fireEvent.press(getByRole("button"));
      fireEvent.press(getByRole("button"));
      expect(onToggle).toHaveBeenCalledTimes(2);
      expect(onToggle).toHaveBeenNthCalledWith(1, true);
      expect(onToggle).toHaveBeenNthCalledWith(2, false);
    });

    it("does not throw without an onToggle handler", () => {
      const { getByRole } = render(<UiCollapsable title="FAQ" />);
      expect(() => fireEvent.press(getByRole("button"))).not.toThrow();
    });
  });
});
