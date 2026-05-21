import { Platform, Pressable } from "react-native";
import type { PressableProps } from "react-native";

const UiPressable = ({ style, ...props }: PressableProps) => (
  <Pressable
    android_ripple={{ color: "rgba(0,0,0,0.1)" }}
    style={(state) => [
      Platform.OS !== "android" && state.pressed && { opacity: 0.7 },
      typeof style === "function" ? style(state) : style,
    ]}
    {...props}
  />
);

export default UiPressable;
