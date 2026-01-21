import { Text as DefaultText } from "react-native";

import { useThemeColor } from "../../hooks/useThemeColor";
import { ThemeProperties } from "../../types";

type TextProperties = ThemeProperties & DefaultText["props"] & { key?: string };

const Text = (properties: TextProperties) => {
  const { style, lightColor, darkColor, ...otherProperties } = properties;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <DefaultText
      style={[{ color }, { fontFamily: "SourceSansPro" }, style]}
      {...otherProperties}
    />
  );
};

export default Text;
