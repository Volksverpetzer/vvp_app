import { useRouter } from "expo-router";
import type { PropsWithChildren, ReactNode } from "react";
import React, { useMemo } from "react";
import { Animated, View } from "react-native";
import type { ViewStyle } from "react-native";

import { HeartIcon } from "#/components/Icons";
import UiHeaderGradient from "#/components/ui/UiHeaderGradient";
import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { fontFamily } from "#/constants/FontFamily";
import { iconSizes } from "#/constants/IconSizes";
import { layers } from "#/constants/Layers";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

/**
 * Props for the AnimatedHeader component.
 * @property title - The header title text.
 * @property hideSupportHeart - If true, hides the support heart icon.
 * @property scrollOffsetY - Animated.Value tracking vertical scroll offset.
 * @property maxHeight - Header height when fully expanded.
 * @property minHeight - Header height when collapsed.
 */
interface AnimatedHeaderProperties extends PropsWithChildren {
  title?: ReactNode;
  hideSupportHeart?: boolean;
  scrollOffsetY: Animated.Value;
  maxHeight: number;
  minHeight: number;
}

const gradientContainerStyle: ViewStyle = {
  width: "100%",
  flex: 1,
  alignItems: "center",
  justifyContent: "flex-end",
  paddingBottom: 45,
};

/**
 * AnimatedHeader renders a collapsible header bar that shrinks and fades
 * based on scroll position. It accepts an optional title (string or node)
 * and optional children rendered below it.
 */
const AnimatedHeader = (properties: AnimatedHeaderProperties) => {
  const {
    hideSupportHeart,
    scrollOffsetY,
    title,
    maxHeight,
    minHeight,
    children,
  } = properties;

  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const router = useRouter();

  // Calculate scroll distance only when props change
  const H_SCROLL_DISTANCE = useMemo(
    () => maxHeight - minHeight,
    [maxHeight, minHeight],
  );

  // Interpolate animated values and memoize the resulting animated values.
  const headerScrollHeight = useMemo(
    () =>
      scrollOffsetY.interpolate({
        inputRange: [0, H_SCROLL_DISTANCE],
        outputRange: [maxHeight, minHeight],
        extrapolate: "clamp",
      }),
    [scrollOffsetY, H_SCROLL_DISTANCE, maxHeight, minHeight],
  );

  const headerFontSize = useMemo(
    () =>
      scrollOffsetY.interpolate({
        inputRange: [0, H_SCROLL_DISTANCE],
        outputRange: [45, 30],
        extrapolate: "clamp",
      }),
    [scrollOffsetY, H_SCROLL_DISTANCE],
  );

  const titleOpacity = useMemo(
    () =>
      scrollOffsetY.interpolate({
        inputRange: [0, H_SCROLL_DISTANCE * 0.5],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [scrollOffsetY, H_SCROLL_DISTANCE],
  );

  // Memoize style objects to avoid recreations.
  const animatedViewStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: 0,
      right: 0,
      overflow: "hidden" as const,
      backgroundColor: "transparent" as const,
      height: headerScrollHeight,
      width: "100%" as const,
      zIndex: layers.sticky,
    }),
    [headerScrollHeight],
  );

  const titleTextStyle = useMemo(
    () => ({
      paddingBottom: spacing.md,
      fontFamily: fontFamily.bold,
      zIndex: layers.raised,
      fontSize: headerFontSize,
      color: corporate,
    }),
    [headerFontSize, corporate],
  );

  return (
    <Animated.View style={animatedViewStyle}>
      <UiHeaderGradient style={gradientContainerStyle}>
        {!hideSupportHeart && (
          <UiPressable
            accessibilityRole="button"
            onPress={() => {
              router.push("/support");
            }}
            style={{ position: "absolute", top: 20, right: "10%" }}
          >
            <HeartIcon color={corporate} size={iconSizes.lg} />
          </UiPressable>
        )}
        {title &&
          (typeof title === "string" ? (
            <Animated.Text
              style={[
                titleTextStyle,
                children ? { opacity: titleOpacity } : null,
              ]}
            >
              {title}
            </Animated.Text>
          ) : (
            <Animated.View style={{ opacity: titleOpacity, flex: 1 }}>
              {title}
            </Animated.View>
          ))}
        <View
          style={{
            marginHorizontal: spacing.md,
          }}
        >
          {children}
        </View>
      </UiHeaderGradient>
    </Animated.View>
  );
};

export default React.memo(AnimatedHeader);
