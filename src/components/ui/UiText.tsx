import type { TextProps } from "react-native";
import { Text } from "react-native";

import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type TextProperties = TextProps & { key?: string };

const UiText = (properties: TextProperties) => {
  const { style, ...otherProperties } = properties;
  const colorScheme = useAppColorScheme();
  const color = Colors[colorScheme].text;

  return (
    <Text
      style={[
        { color },
        {
          fontFamily: "SourceSansPro",
          includeFontPadding: false,
        },
        style,
      ]}
      {...otherProperties}
    />
  );
};

export default UiText;
