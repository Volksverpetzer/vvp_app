import { View as DefaultView } from "react-native";

import { useThemeColor } from "#/hooks/useThemeColor";
import type { ThemeProperties } from "#/types";

export type CardProperties = ThemeProperties &
  DefaultView["props"] & {
    key?: string;
    backgroundVariant?: "primary" | "secondary";
  };

const Card = (properties: CardProperties) => {
  const {
    style,
    lightColor,
    darkColor,
    backgroundVariant = "primary",
    ...otherProperties
  } = properties;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    backgroundVariant === "secondary" ? "secondaryBackground" : "background",
  );

  return (
    <DefaultView
      style={[{ backgroundColor, borderRadius: 20, padding: 20 }, style]}
      {...otherProperties}
    />
  );
};

export default Card;
