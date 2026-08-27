import type { ReactNode } from "react";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { elevation } from "#/constants/Elevation";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface UiFabProperties {
  children: ReactNode;
  onPress: PressableProps["onPress"];
  /**
   * Diameter in px. The corner radius is always half of it, not a `radii`
   * token — per the note on `radii` in constants/BorderRadius.ts, a circle
   * sizes its own corner rather than coming from the radius scale.
   */
  size?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Circular, icon-only pressable: a solid disc sized to its own diameter,
 * centering a single icon child, with a default `elevation.sm` shadow.
 * Used both for floating controls (e.g. back-to-top) and standalone
 * circular CTAs (e.g. the article footer's share button) — position for a
 * floating placement is still the caller's concern via `style`. For a
 * button with a text label, use {@link UiButton} instead.
 */
const UiFab = ({
  children,
  onPress,
  size = 48,
  accessibilityLabel,
  accessibilityHint,
  style,
}: UiFabProperties) => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].primary;
  const diameter = { width: size, height: size, borderRadius: size / 2 };

  return (
    // The Android `elevation` shadow and the iOS/web `boxShadow` split
    // across two nodes because `boxShadow` gets clipped by `overflow:
    // hidden` on the same view — and the inner Pressable needs that
    // overflow: hidden to keep its ripple circular.
    <View style={[diameter, { boxShadow: elevation.sm.boxShadow }, style]}>
      <UiPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={[
          diameter,
          {
            alignItems: "center",
            justifyContent: "center",
            backgroundColor,
            elevation: elevation.sm.android,
            overflow: "hidden",
          },
        ]}
      >
        {children}
      </UiPressable>
    </View>
  );
};

export default UiFab;
