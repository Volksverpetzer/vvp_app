import { act, renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";

import { useWebFocusRing } from "#/hooks/useWebFocusRing";

const setOS = (os: typeof Platform.OS) =>
  Object.defineProperty(Platform, "OS", { value: os, configurable: true });

describe("useWebFocusRing", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    setOS(originalOS);
  });

  it("moves the focus ring from the input to the container on web", async () => {
    setOS("web");
    const { result } = await renderHook(() => useWebFocusRing("#123456"));

    expect(result.current.inputStyle).toEqual({ outlineStyle: "none" });
    expect(result.current.containerStyle).toBeUndefined();

    await act(() => result.current.onFocus());
    expect(result.current.containerStyle).toEqual({
      outlineColor: "#123456",
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    });

    await act(() => result.current.onBlur());
    expect(result.current.containerStyle).toBeUndefined();
  });

  it("leaves styles untouched on native", async () => {
    setOS("ios");
    const { result } = await renderHook(() => useWebFocusRing("#123456"));

    await act(() => result.current.onFocus());
    expect(result.current.inputStyle).toBeUndefined();
    expect(result.current.containerStyle).toBeUndefined();
  });
});
