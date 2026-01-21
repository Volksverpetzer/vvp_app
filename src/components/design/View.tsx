import { View as DefaultView } from "react-native";

import { useThemeColor } from "../../hooks/useThemeColor";
import { ThemeProperties } from "../../types";

type ViewProperties = ThemeProperties & DefaultView["props"] & { key?: string };

const View = (properties: ViewProperties) => {
  const { style, lightColor, darkColor, ...otherProperties } = properties;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background",
  );

  return (
    <DefaultView style={[{ backgroundColor }, style]} {...otherProperties} />
  );
};

export default View;
