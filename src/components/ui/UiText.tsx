import { Text } from "react-native";

import { useThemeColor } from "#/hooks/useThemeColor";

type TextProperties = Text["props"] & { key?: string };

const UiText = (properties: TextProperties) => {
  const { style, ...otherProperties } = properties;
  const color = useThemeColor("text");

  return (
    <Text
      style={[{ color }, { fontFamily: "SourceSansPro" }, style]}
      {...otherProperties}
    />
  );
};

export default UiText;
