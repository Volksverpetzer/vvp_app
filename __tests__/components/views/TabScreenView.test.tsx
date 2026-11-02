import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";
import { Platform, Text } from "react-native";
import type { ReactTestRendererJSON } from "react-test-renderer";

import TabScreenView from "#/components/views/TabScreenView";

const mockUseSafeAreaInsets = jest.fn();

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockUseSafeAreaInsets(),
}));

const originalOS = Platform.OS;
const originalIsPad = (Platform as { isPad?: boolean }).isPad;

const setPlatform = (os: typeof Platform.OS, isPad: boolean) => {
  Object.defineProperty(Platform, "OS", { configurable: true, value: os });
  Object.defineProperty(Platform, "isPad", {
    configurable: true,
    value: isPad,
  });
};

const renderedPaddingTop = async () => {
  const { toJSON } = await render(
    <TabScreenView>
      <Text>content</Text>
    </TabScreenView>,
  );
  const root = toJSON() as ReactTestRendererJSON;
  return (root.props.style as { paddingTop: number }).paddingTop;
};

describe("TabScreenView", () => {
  afterEach(() => {
    setPlatform(originalOS, originalIsPad);
  });

  it("pads by the tab's top inset on iPad, where the tab bar floats at the top", async () => {
    setPlatform("ios", true);
    mockUseSafeAreaInsets.mockReturnValue({ top: 64 });
    expect(await renderedPaddingTop()).toBe(64);
  });

  it("adds no padding on iPad when the tab bar is at the bottom (compact width)", async () => {
    setPlatform("ios", true);
    mockUseSafeAreaInsets.mockReturnValue({ top: 0 });
    expect(await renderedPaddingTop()).toBe(0);
  });

  it("ignores the top inset on iPhone, where the tab bar is always at the bottom", async () => {
    setPlatform("ios", false);
    mockUseSafeAreaInsets.mockReturnValue({ top: 62 });
    expect(await renderedPaddingTop()).toBe(0);
  });

  it("ignores the top inset on Android", async () => {
    setPlatform("android", false);
    mockUseSafeAreaInsets.mockReturnValue({ top: 24 });
    expect(await renderedPaddingTop()).toBe(0);
  });
});
