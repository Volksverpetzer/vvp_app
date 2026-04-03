import { Text } from "react-native";

import { useThemeColor } from "#/hooks/useThemeColor";
import type { ThemeProperties } from "#/types";

type TextProperties = ThemeProperties & Text["props"] & { key?: string };

const UiText = (properties: TextProperties) => {
  const { style, lightColor, darkColor, ...otherProperties } = properties;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[{ color }, { fontFamily: "SourceSansPro" }, style]}
      {...otherProperties}
    />
  );
};

export default UiText;
