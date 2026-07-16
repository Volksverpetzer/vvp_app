import type { TextProps } from "react-native";
import { Text } from "react-native";

import Colors from "#/constants/Colors";
import { type FontSizeToken, fontSizes } from "#/constants/FontSizes";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type TextProperties = TextProps & {
  key?: string;
  /**
   * Font size from the shared scale (see {@link fontSizes}). Prefer this over a
   * raw `fontSize` in `style` so text stays on the typographic scale. An
   * explicit `fontSize` in `style` still wins if you need to override.
   */
  size?: FontSizeToken;
};

const UiText = (properties: TextProperties) => {
  const { style, size, ...otherProperties } = properties;
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
        size ? { fontSize: fontSizes[size] } : null,
        style,
      ]}
      {...otherProperties}
    />
  );
};

export default UiText;
