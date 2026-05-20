import type { ReactNode } from "react";
import { Pressable } from "react-native";

import UiText from "#/components/ui/UiText";

interface UiEmptyStateProps {
  icon: ReactNode;
  children: ReactNode;
  onPress?: () => void;
}

const UiEmptyState = ({ icon, children, onPress }: UiEmptyStateProps) => (
  <Pressable
    accessibilityRole={onPress ? "button" : undefined}
    onPress={onPress}
    style={{ alignItems: "center", gap: 12 }}
  >
    {icon}
    <UiText style={{ textAlign: "center", fontSize: 18 }}>{children}</UiText>
  </Pressable>
);

export default UiEmptyState;
