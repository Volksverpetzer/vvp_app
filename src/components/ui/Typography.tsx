import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { type TextVariant, textVariants } from "#/constants/TextVariants";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type TypographyProperties = React.ComponentProps<typeof UiText> & {
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
 * `size` / `bold` / `color` per screen. It resolves the role into concrete
 * `UiText` props; `size`, `bold` and an explicit `color` in `style` still
 * override the role for one-offs.
 */
const Typography = ({
  type,
  size,
  bold,
  style,
  ...properties
}: TypographyProperties) => {
  const colorScheme = useAppColorScheme();
  const preset = textVariants[type];
  const toneColor =
    preset.tone === "muted" ? Colors[colorScheme].textMuted : undefined;

  return (
    <UiText
      size={size ?? preset.size}
      bold={bold ?? preset.bold}
      style={toneColor ? [{ color: toneColor }, style] : style}
      {...properties}
    />
  );
};

export default Typography;
