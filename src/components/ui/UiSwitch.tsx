import type { ComponentProps } from "react";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";
import { Platform, StyleSheet, Switch } from "react-native";

import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { isDarkMode } from "#/helpers/utils/color";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

// Extend native Switch props locally to allow `activeThumbColor` which
// is accepted at runtime but may be missing from the RN typings used in this project.
// See https://stackoverflow.com/a/73313139
type ExtendedSwitchProps = ComponentProps<typeof Switch> & {
  activeThumbColor?: ColorValue;
  activeTrackColor?: ColorValue;
};

interface UiSwitchProperties {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * App-themed switch. On Android it also cancels the native switch's inner
 * inset, so its track ends flush with the trailing edge of the row like an
 * icon would.
 */
const UiSwitch = ({
  value,
  onValueChange,
  disabled,
  testID,
  accessibilityLabel,
  style,
}: UiSwitchProperties) => {
  const colorScheme = useAppColorScheme();
  const {
    primaryMuted,
    textMuted,
    surface,
    surfaceDisabled,
    surfaceInput,
    onPrimary,
  } = Colors[colorScheme];

  // Build the Switch props in a local object so we can add runtime-only props
  // (like `activeThumbColor`) without TypeScript complaining about them.
  const switchProps: ExtendedSwitchProps = {
    testID,
    accessibilityLabel,
    activeTrackColor: primaryMuted,
    activeThumbColor: onPrimary,
    ios_backgroundColor: isDarkMode(colorScheme) // ios only
      ? surface
      : onPrimary,
    thumbColor: value && !disabled ? onPrimary : textMuted,
    trackColor: {
      // Dark track under the light grey thumb — the thumb itself is
      // textMuted, so the off-track must not use the same grey
      false: isDarkMode(colorScheme) ? surfaceDisabled : surfaceInput,
      true: primaryMuted,
    },
    disabled,
    onValueChange,
    value,
    // The Android switch draws its track ~10dp inside its bounds; pull it
    // out so it lines up with the icons in neighbouring rows.
    style: [Platform.OS === "android" && styles.androidInset, style],
  };

  // cast to native Switch props to satisfy TypeScript while keeping runtime props
  return <Switch {...(switchProps as ComponentProps<typeof Switch>)} />;
};

const styles = StyleSheet.create({
  androidInset: { marginRight: -spacing.md },
});

export default UiSwitch;
