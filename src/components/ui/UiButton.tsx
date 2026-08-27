import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

export type UiButtonVariant = "primary" | "accent" | "secondary";
export type UiButtonShape = "rounded" | "pill";

interface UiButtonProperties {
  label: string;
  onPress: PressableProps["onPress"];
  /**
   * `primary` — corporate color, for a paired-with-secondary action.
   * `accent` — brand accent color, for a standalone hero CTA.
   * `secondary` — surface color, for a low-emphasis action paired with a
   * `primary` one (e.g. dismiss next to confirm).
   */
  variant?: UiButtonVariant;
  /** `rounded` (default, `radii.md`) or `pill` (`radii.full`) for hero CTAs. */
  shape?: UiButtonShape;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared solid call-to-action button: a centered bold label on a colored,
 * rounded surface. Not for an icon-only circular button — that sizes its
 * radius from its own dimensions instead, see the note on {@link radii}.
 */
const UiButton = ({
  label,
  onPress,
  variant = "primary",
  shape = "rounded",
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: UiButtonProperties) => {
  const colorScheme = useAppColorScheme();
  const { accent, onPrimary, primary, surface, surfaceDisabled, text } =
    Colors[colorScheme];

  const backgroundColor = disabled
    ? surfaceDisabled
    : variant === "secondary"
      ? surface
      : variant === "accent"
        ? accent
        : primary;
  const textColor = variant === "secondary" ? text : onPrimary;

  return (
    <UiPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor,
          borderRadius: shape === "pill" ? radii.full : radii.md,
        },
        style,
      ]}
    >
      <UiText
        size="base"
        bold
        style={{ color: textColor, textAlign: "center" }}
      >
        {label}
      </UiText>
    </UiPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});

export default UiButton;
