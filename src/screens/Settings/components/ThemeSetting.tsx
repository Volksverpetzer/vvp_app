import { useContext } from "react";
import { StyleSheet, View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { ThemePreference } from "#/types";

const options: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Hell" },
  { value: "dark", label: "Dunkel" },
];

/**
 * Segmented picker for the app's color theme: follow the device setting, or
 * always render light or dark regardless of it.
 */
const ThemeSetting = () => {
  const { themePreference, setThemePreference } = useContext(SettingsContext);
  const colorScheme = useAppColorScheme();
  const { onPrimary, primary, surfaceInput, text } = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View
        accessibilityRole="radiogroup"
        style={[styles.segments, { backgroundColor: surfaceInput }]}
      >
        {options.map(({ value, label }) => {
          const selected = themePreference === value;
          return (
            <UiPressable
              key={value}
              testID={`themeOption-${value}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setThemePreference(value)}
              style={[styles.segment, selected && { backgroundColor: primary }]}
            >
              <UiText
                size="base"
                bold={selected}
                style={{ color: selected ? onPrimary : text }}
              >
                {label}
              </UiText>
            </UiPressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  segments: {
    flexDirection: "row",
    borderRadius: radii.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
  },
});

export default ThemeSetting;
