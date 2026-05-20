import React, { type ReactNode } from "react";
import { View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

interface UiEmptyStateProps {
  icon: ReactNode;
  children: ReactNode;
  onPress?: () => void;
}

const style = { alignItems: "center" as const, gap: 12 };

const UiEmptyState = ({ icon, children, onPress }: UiEmptyStateProps) => {
  const corporate = useCorporateColor();
  const coloredIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, {
        color: corporate,
      })
    : icon;

  const content = (
    <>
      {coloredIcon}
      <UiText style={{ textAlign: "center", fontSize: 18 }}>{children}</UiText>
    </>
  );

  if (onPress) {
    return (
      <UiPressable accessibilityRole="button" onPress={onPress} style={style}>
        {content}
      </UiPressable>
    );
  }

  return <View style={style}>{content}</View>;
};

export default UiEmptyState;
