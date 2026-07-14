import { describe, expect, it } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { useBackToTop } from "#/hooks/useBackToTop";

const scrollEvent = (y: number) =>
  ({
    nativeEvent: { contentOffset: { y } },
  }) as NativeSyntheticEvent<NativeScrollEvent>;

describe("useBackToTop", () => {
  it("is hidden initially", async () => {
    const { result } = await renderHook(() => useBackToTop(500));
    expect(result.current.visible).toBe(false);
  });

  it("becomes visible after scrolling past the threshold", async () => {
    const { result } = await renderHook(() => useBackToTop(500));
    await act(() => result.current.onScroll(scrollEvent(501)));
    expect(result.current.visible).toBe(true);
  });

  it("hides again when scrolling back above the threshold", async () => {
    const { result } = await renderHook(() => useBackToTop(500));
    await act(() => result.current.onScroll(scrollEvent(800)));
    await act(() => result.current.onScroll(scrollEvent(100)));
    expect(result.current.visible).toBe(false);
  });

  it("stays hidden at exactly the threshold", async () => {
    const { result } = await renderHook(() => useBackToTop(500));
    await act(() => result.current.onScroll(scrollEvent(500)));
    expect(result.current.visible).toBe(false);
  });
});
