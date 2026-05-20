import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import UiText from "#/components/ui/UiText";

interface UiEmptyStateProps {
  icon: ReactNode;
  children: ReactNode;
  onPress?: () => void;
}

const style = { alignItems: "center" as const, gap: 12 };

const UiEmptyState = ({ icon, children, onPress }: UiEmptyStateProps) => {
  const content = (
    <>
      {icon}
      <UiText style={{ textAlign: "center", fontSize: 18 }}>{children}</UiText>
    </>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={style}>
        {content}
      </Pressable>
    );
  }

  return <View style={style}>{content}</View>;
};

export default UiEmptyState;
