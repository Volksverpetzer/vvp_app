import React, { type ReactNode } from "react";
import { View } from "react-native";
import type { ViewStyle } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

interface UiEmptyStateProps {
  icon: React.ReactElement<{ color?: string }>;
  children: ReactNode;
  onPress?: () => void;
  testID?: string;
}

const style: ViewStyle = { alignItems: "center", gap: 12 };

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
      <UiText style={{ textAlign: "center", fontSize: 18 }}>{children}</UiText>
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
