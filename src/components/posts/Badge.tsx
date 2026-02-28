import type { ReactNode } from "react";
import type { ColorValue, ViewStyle } from "react-native";

import View from "#/components/design/View";

type BadgeProperties = {
  children: ReactNode;
  position: "topLeft" | "topRight";
  color: ColorValue;
};

const Badge = ({ children, position, color }: BadgeProperties) => {
  const style: ViewStyle = {
    backgroundColor: color,
    paddingVertical: 3,
    paddingHorizontal: 10,
    position: "absolute",
    top: 0,
    ...(position === "topLeft"
      ? { left: 0, borderBottomRightRadius: 5 }
      : { right: 0, borderBottomLeftRadius: 5 }),
  };

  return <View style={style}>{children}</View>;
};

export default Badge;
