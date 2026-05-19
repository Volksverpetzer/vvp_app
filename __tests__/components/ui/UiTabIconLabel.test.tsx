import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Animated } from "react-native";

import UiTabIconLabel from "#/components/ui/UiTabIconLabel";

// useAppColorScheme → "light", expo-constants colors mocked globally in jest-setup.ts
// light scheme from jest-setup: iconOnPrimary="#3893C0", iconMuted="#aaa", muted="#bbb", primary="#1b7194"

const makeIcon = () => jest.fn((_color: string) => null);

describe("UiTabIconLabel", () => {
  it("renders the label text", () => {
    const { getByText } = render(
      <UiTabIconLabel
        icon={makeIcon()}
        label="Favoriten"
        isActive={false}
        onPress={jest.fn()}
      />,
    );
    expect(getByText("Favoriten")).toBeTruthy();
  });

  it("calls onPress when the tab is pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <UiTabIconLabel
        icon={makeIcon()}
        label="Favoriten"
        isActive={false}
        onPress={onPress}
      />,
    );
    fireEvent.press(getByRole("tab"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  describe("accessibility", () => {
    it("exposes the label as accessibilityLabel", () => {
      const { getByLabelText } = render(
        <UiTabIconLabel
          icon={makeIcon()}
          label="Favoriten"
          isActive={false}
          onPress={jest.fn()}
        />,
      );
      expect(getByLabelText("Favoriten")).toBeTruthy();
    });

    it("marks the tab as selected when active", () => {
      const { getByRole } = render(
        <UiTabIconLabel
          icon={makeIcon()}
          label="Favoriten"
          isActive={true}
          onPress={jest.fn()}
        />,
      );
      expect(getByRole("tab", { selected: true })).toBeTruthy();
    });

    it("marks the tab as not selected when inactive", () => {
      const { getByRole } = render(
        <UiTabIconLabel
          icon={makeIcon()}
          label="Favoriten"
          isActive={false}
          onPress={jest.fn()}
        />,
      );
      expect(getByRole("tab", { selected: false })).toBeTruthy();
    });
  });

  describe("icon color", () => {
    it("passes iconOnPrimary color to icon when active", () => {
      const icon = makeIcon();
      render(
        <UiTabIconLabel
          icon={icon}
          label="Favoriten"
          isActive={true}
          onPress={jest.fn()}
        />,
      );
      expect(icon).toHaveBeenCalledWith("#3893C0");
    });

    it("passes iconMuted color to icon when inactive", () => {
      const icon = makeIcon();
      render(
        <UiTabIconLabel
          icon={icon}
          label="Favoriten"
          isActive={false}
          onPress={jest.fn()}
        />,
      );
      expect(icon).toHaveBeenCalledWith("#aaa");
    });
  });

  describe("background color", () => {
    it("uses primary background when active", () => {
      const { toJSON } = render(
        <UiTabIconLabel
          icon={makeIcon()}
          label="Favoriten"
          isActive={true}
          onPress={jest.fn()}
        />,
      );
      const root = toJSON() as any;
      const styles = [root.props.style].flat();
      const combined = Object.assign({}, ...styles);
      expect(combined.backgroundColor).toBe("#1b7194");
    });

    it("uses muted background when inactive", () => {
      const { toJSON } = render(
        <UiTabIconLabel
          icon={makeIcon()}
          label="Favoriten"
          isActive={false}
          onPress={jest.fn()}
        />,
      );
      const root = toJSON() as any;
      const styles = [root.props.style].flat();
      const combined = Object.assign({}, ...styles);
      expect(combined.backgroundColor).toBe("#bbb");
    });
  });

  describe("label rendering", () => {
    it("renders a static Animated.Text when no animation props are given", () => {
      const { getByText } = render(
        <UiTabIconLabel
          icon={makeIcon()}
          label="Quellen"
          isActive={false}
          onPress={jest.fn()}
        />,
      );
      expect(getByText("Quellen")).toBeTruthy();
    });

    it("renders an animated label container when animatedLabelHeight is provided", () => {
      const animatedHeight = new Animated.Value(20).interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
      });
      const animatedOpacity = new Animated.Value(1).interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      });
      const { getByText } = render(
        <UiTabIconLabel
          icon={makeIcon()}
          label="Quellen"
          isActive={false}
          onPress={jest.fn()}
          animatedLabelHeight={animatedHeight}
          animatedLabelOpacity={animatedOpacity}
        />,
      );
      expect(getByText("Quellen")).toBeTruthy();
    });
  });
});
