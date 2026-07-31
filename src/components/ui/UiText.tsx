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
  /** Render in SourceSansProBold instead of the regular weight. */
  bold?: boolean;
};

/**
 * Low-level styled text primitive: applies the theme text color, a font-scale
 * size and the regular/bold family. For text with a semantic role (titles,
 * meta lines) prefer {@link Typography}, which layers those roles on top.
 */
const UiText = (properties: TextProperties) => {
  const { style, size, bold, ...otherProperties } = properties;
  const colorScheme = useAppColorScheme();
  const color = Colors[colorScheme].text;

  return (
    <Text
      style={[
        { color },
        {
          fontFamily: bold ? "SourceSansProBold" : "SourceSansPro",
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
