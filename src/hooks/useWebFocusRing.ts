import { useState } from "react";
import { Platform } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";

const RING_WIDTH = 2;
const isWeb = Platform.OS === "web";
// Chrome draws `outline-style: auto` regardless of outline width or color,
// so the style has to be "none". react-native-web passes it through, but
// RN's outlineStyle type only lists solid/dotted/dashed, hence the cast.
const inputStyle: TextStyle | undefined = isWeb
  ? ({ outlineStyle: "none" } as unknown as TextStyle)
  : undefined;

/**
 * On web, browsers draw their focus outline on the bare <input>. When the
 * visible field is a wrapping View (rounded box, trailing icons), that ring
 * sits inside it instead of around it. This moves the ring to the wrapper:
 * add `containerStyle` to the wrapping View, and `inputStyle` plus
 * `onFocus`/`onBlur` to the TextInput. No-op on native.
 */
export const useWebFocusRing = (color: string) => {
  const [focused, setFocused] = useState(false);

  const containerStyle: ViewStyle | undefined =
    isWeb && focused
      ? {
          outlineColor: color,
          outlineOffset: RING_WIDTH,
          outlineStyle: "solid",
          outlineWidth: RING_WIDTH,
        }
      : undefined;

  return {
    containerStyle,
    inputStyle,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };
};
