import type { ComponentProps } from "react";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import {
  type TextVariant,
  type TextVariantSpec,
  textVariants,
} from "#/constants/TextVariants";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type TypographyProperties = ComponentProps<typeof UiText> & {
  /**
   * Semantic role of this text (see {@link textVariants}). Sets size, weight
   * and color tone at once so the same kind of text — a screen title, a
   * date/duration/author meta line — looks identical wherever it appears.
   */
  type: TextVariant;
};

/**
 * Semantic text component. Prefer this over `UiText` for anything with a role
 * (titles, meta lines): `<Typography type="title">` instead of hand-tuning
 * `size` / `bold` / `color` / `lineHeight` / alignment per screen. It resolves
 * the role into concrete `UiText` props and defaults to left alignment; `size`,
 * `bold` and an explicit `color`/`textAlign` in `style` still override the role
 * for one-offs. Layout (padding, margins) stays with the caller.
 */
const Typography = ({
  type,
  size,
  bold,
  style,
  ...properties
}: TypographyProperties) => {
  const colorScheme = useAppColorScheme();
  const preset: TextVariantSpec = textVariants[type];
  const toneColor =
    preset.tone === "muted" ? Colors[colorScheme].textMuted : undefined;

  return (
    <UiText
      size={size ?? preset.size}
      bold={bold ?? preset.bold}
      style={[
        { textAlign: "left" },
        toneColor ? { color: toneColor } : null,
        preset.lineHeight ? { lineHeight: preset.lineHeight } : null,
        style,
      ]}
      {...properties}
    />
  );
};

export default Typography;
