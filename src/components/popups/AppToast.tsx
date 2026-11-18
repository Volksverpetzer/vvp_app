import type { ComponentType } from "react";
import { StyleSheet, View } from "react-native";

import {
  ErrorIcon,
  InfoIcon,
  SuccessIcon,
  TrophyIcon,
} from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { elevation } from "#/constants/Elevation";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

export type AppToastVariant = "success" | "error" | "info" | "achievement";

interface AppToastProperties {
  variant: AppToastVariant;
  text1?: string;
  text2?: string;
  /** Makes the toast a button, e.g. to open the related screen. */
  onPress?: () => void;
  testID?: string;
}

const ICONS: Record<
  AppToastVariant,
  ComponentType<{ size?: number; color?: string }>
> = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
  achievement: TrophyIcon,
};

/**
 * The app's one toast: a card in the app's own colors (light and dark) with
 * an icon whose color says what kind of message it is. Used for every toast
 * type in `toastConfig`.
 */
const AppToast = ({
  variant,
  text1,
  text2,
  onPress,
  testID = `toast.${variant}`,
}: AppToastProperties) => {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const accent =
    variant === "success"
      ? colors.success
      : variant === "error"
        ? colors.error
        : colors.primary;
  const Icon = ICONS[variant];

  const content = (
    <>
      <Icon size={iconSizes.md} color={accent} />
      <View style={styles.texts}>
        {text1 ? (
          <UiText
            bold
            size="base"
            // An achievement's title carries the brand color, as before
            style={variant === "achievement" ? { color: accent } : undefined}
          >
            {text1}
          </UiText>
        ) : null}
        {text2 ? <UiText size="sm">{text2}</UiText> : null}
      </View>
    </>
  );

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.background,
      borderLeftColor: accent,
      boxShadow: elevation.md.boxShadow,
      elevation: elevation.md.android,
    },
  ];

  // Errors are announced right away; the others politely
  const liveRegion = variant === "error" ? "assertive" : "polite";

  return onPress ? (
    <UiPressable
      accessibilityRole="button"
      accessibilityLiveRegion={liveRegion}
      onPress={onPress}
      style={cardStyle}
      testID={testID}
    >
      {content}
    </UiPressable>
  ) : (
    <View
      accessible
      accessibilityLiveRegion={liveRegion}
      style={cardStyle}
      testID={testID}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderLeftWidth: 4,
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing.md,
    maxWidth: 480,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: "90%",
  },
  texts: {
    backgroundColor: "transparent",
    flexShrink: 1,
    gap: spacing.xs,
  },
});

export default AppToast;
