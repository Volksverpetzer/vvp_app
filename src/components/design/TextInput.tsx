import { TextInput as DefaultTextInput } from "react-native";

import { useThemeColor } from "../../hooks/useThemeColor";
import { ThemeProperties } from "../../types";

type TextInputProperties = ThemeProperties &
  DefaultTextInput["props"] & { key?: string };

const TextInput = (properties: TextInputProperties) => {
  const { style, lightColor, darkColor, key, ...otherProperties } = properties;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "inputBackground",
  );
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <DefaultTextInput
      style={[{ backgroundColor, color }, style]}
      {...otherProperties}
    />
  );
};

export default TextInput;
