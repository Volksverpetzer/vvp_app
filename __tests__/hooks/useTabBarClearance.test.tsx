import { describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";

import { spacing } from "#/constants/Spacing";
import { useTabBarClearance } from "#/hooks/useTabBarClearance";

const mockUseSafeAreaInsets = jest.fn();

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockUseSafeAreaInsets(),
}));

describe("useTabBarClearance", () => {
  it("adds spacing.xl breathing room on top of the safe-area bottom inset", async () => {
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 83 });
    const { result } = await renderHook(() => useTabBarClearance());
    expect(result.current).toBe(83 + spacing.xl);
  });

  it("still returns spacing.xl when the device has no bottom inset", async () => {
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 0 });
    const { result } = await renderHook(() => useTabBarClearance());
    expect(result.current).toBe(spacing.xl);
  });
});
