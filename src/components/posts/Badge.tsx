import type { ReactNode } from "react";
import type { ColorValue, ViewStyle } from "react-native";
import { View } from "react-native";

export type BadgePosition =
  "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

interface BadgeProperties {
  children: ReactNode;
  position: BadgePosition;
  color: ColorValue;
}

const Badge = ({ children, position, color }: BadgeProperties) => {
  const isTop = position === "topLeft" || position === "topRight";
  const isLeft = position === "topLeft" || position === "bottomLeft";

  const style: ViewStyle = {
    backgroundColor: color,
    paddingVertical: 3,
    paddingHorizontal: 10,
    position: "absolute",
    ...(isTop ? { top: 0 } : { bottom: 0 }),
    ...(isLeft
      ? {
          left: 0,
          [isTop ? "borderBottomRightRadius" : "borderTopRightRadius"]: 5,
        }
      : {
          right: 0,
          [isTop ? "borderBottomLeftRadius" : "borderTopLeftRadius"]: 5,
        }),
  };

  return <View style={style}>{children}</View>;
};

export default Badge;
