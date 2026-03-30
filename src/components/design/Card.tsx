import { View as DefaultView } from "react-native";

import { useThemeColor } from "#/hooks/useThemeColor";
import type { ThemeProperties } from "#/types";

export type CardProperties = ThemeProperties &
  DefaultView["props"] & { key?: string; level?: 0 | 1 };

const Card = (properties: CardProperties) => {
  const {
    style,
    lightColor,
    darkColor,
    level = 0,
    ...otherProperties
  } = properties;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    level === 1 ? "secondaryBackground" : "background",
  );

  return (
    <DefaultView
      style={[{ backgroundColor, borderRadius: 20, padding: 20 }, style]}
      {...otherProperties}
    />
  );
};

export default Card;
