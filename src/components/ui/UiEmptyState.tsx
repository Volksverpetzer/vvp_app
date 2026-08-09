import React, { type ReactNode } from "react";
import { View } from "react-native";
import type { ViewStyle } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { spacing } from "#/constants/Spacing";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

interface UiEmptyStateProps {
  icon: React.ReactElement<{ color?: string }>;
  children: ReactNode;
  onPress?: () => void;
  testID?: string;
}

const style: ViewStyle = { alignItems: "center", gap: spacing.md };

const UiEmptyState = ({
  icon,
  children,
  onPress,
  testID,
}: UiEmptyStateProps) => {
  const corporate = useCorporateColor();
  const coloredIcon = React.cloneElement(icon, {
    color: icon.props.color ?? corporate,
  });

  const content = (
    <>
      {coloredIcon}
      <UiText size="lg" style={{ textAlign: "center" }}>
        {children}
      </UiText>
    </>
  );

  if (onPress) {
    return (
      <UiPressable
        testID={testID}
        accessibilityRole="button"
        onPress={onPress}
        style={style}
      >
        {content}
      </UiPressable>
    );
  }

  return (
    <View testID={testID} style={style}>
      {content}
    </View>
  );
};

export default UiEmptyState;
