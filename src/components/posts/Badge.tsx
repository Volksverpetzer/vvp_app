import { ReactNode } from "react";
import { ViewStyle } from "react-native";

import View from "#/components/design/View";

type BadgeProperties = {
  children: ReactNode;
  position: "topLeft" | "topRight";
  color: string;
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
