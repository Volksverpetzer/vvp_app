import { View as DefaultView } from "react-native";

import { useThemeColor } from "#/hooks/useThemeColor";
import { ThemeProperties } from "#/types";

export type CardProperties = ThemeProperties &
  DefaultView["props"] & { key?: string };

const Card = (properties: CardProperties) => {
  const { style, lightColor, darkColor, ...otherProperties } = properties;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background",
  );

  return (
    <DefaultView
      style={[{ backgroundColor, borderRadius: 20, padding: 20 }, style]}
      {...otherProperties}
    />
  );
};

export default Card;
