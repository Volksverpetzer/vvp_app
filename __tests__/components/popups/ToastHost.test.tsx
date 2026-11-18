import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

import ToastHost, {
  isTabBarAtBottom,
  toastBottomOffset,
} from "#/components/popups/ToastHost";
import { toastConfig } from "#/helpers/toastConfig";

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

const setIsPad = (isPad: boolean) =>
  Object.defineProperty(Platform, "isPad", {
    configurable: true,
    get: () => isPad,
  });

describe("ToastHost", () => {
  afterEach(() => {
    setIsPad(false);
    jest.clearAllMocks();
  });

  it("puts every toast at the bottom, above the tab bar", async () => {
    await render(<ToastHost />);
    expect(jest.mocked(Toast).mock.calls[0][0]).toMatchObject({
      config: toastConfig,
      position: "bottom",
      bottomOffset: toastBottomOffset(34),
    });
  });

  it("keeps the toast clear of the safe area and the tab bar", () => {
    // The test environment runs as iOS: 49pt tab bar plus a small gap
    expect(toastBottomOffset(34)).toBeGreaterThan(34 + 49);
    expect(toastBottomOffset(0)).toBeGreaterThan(49);
  });

  it("adds no tab bar height when the tab bar is not at the bottom", () => {
    expect(toastBottomOffset(20, false)).toBeLessThan(20 + 49);
    expect(toastBottomOffset(20, false)).toBeGreaterThan(20);
  });

  it("knows the tab bar is at the bottom on iPhone", () => {
    setIsPad(false);
    expect(isTabBarAtBottom(1024)).toBe(true);
  });

  it("knows the tab bar is at the top on a regular-width iPad", () => {
    setIsPad(true);
    expect(isTabBarAtBottom(820)).toBe(false);
    expect(isTabBarAtBottom(678)).toBe(false);
  });

  it("knows the tab bar is at the bottom on a compact-width iPad", () => {
    setIsPad(true);
    // Slide Over and narrow Split View
    expect(isTabBarAtBottom(375)).toBe(true);
    expect(isTabBarAtBottom(590)).toBe(true);
  });

  it("drops the tab bar height on a regular-width iPad", async () => {
    setIsPad(true);
    await render(<ToastHost />);
    expect(jest.mocked(Toast).mock.calls[0][0]).toMatchObject({
      bottomOffset: toastBottomOffset(34, false),
    });
  });
});
