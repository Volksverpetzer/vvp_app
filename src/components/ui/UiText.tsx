import type { TextProps } from "react-native";
import { Text } from "react-native";

import Colors from "#/constants/Colors";
import { type FontSizeToken, fontSizes } from "#/constants/FontSizes";
import { type TextVariant, textVariants } from "#/constants/TextVariants";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type TextProperties = TextProps & {
  key?: string;
  /**
   * Semantic role of this text (see {@link textVariants}). Sets size, weight
   * and color at once so the same kind of text looks identical across screens.
   * `size` / `bold` / a `color` in `style` override it.
   */
  variant?: TextVariant;
  /**
   * Font size from the shared scale (see {@link fontSizes}). Prefer this over a
   * raw `fontSize` in `style` so text stays on the typographic scale. An
   * explicit `fontSize` in `style` still wins if you need to override.
   */
  size?: FontSizeToken;
  /** Render in SourceSansProBold instead of the regular weight. */
  bold?: boolean;
};

const UiText = (properties: TextProperties) => {
  const { style, variant, size, bold, ...otherProperties } = properties;
  const colorScheme = useAppColorScheme();
  const palette = Colors[colorScheme];

  const preset = variant ? textVariants[variant] : undefined;
  const effectiveSize = size ?? preset?.size;
  const effectiveBold = bold ?? preset?.bold ?? false;
  const tone = preset?.tone ?? "default";
  const color = tone === "muted" ? palette.textMuted : palette.text;

  return (
    <Text
      style={[
        { color },
        {
          fontFamily: effectiveBold ? "SourceSansProBold" : "SourceSansPro",
          includeFontPadding: false,
        },
        effectiveSize ? { fontSize: fontSizes[effectiveSize] } : null,
        style,
      ]}
      {...otherProperties}
    />
  );
};

export default UiText;
