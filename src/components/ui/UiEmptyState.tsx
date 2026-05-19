import type { ReactNode } from "react";
import { View } from "react-native";

import UiText from "#/components/ui/UiText";

interface UiEmptyStateProps {
  icon: ReactNode;
  children: ReactNode;
  testID?: string;
}

const UiEmptyState = ({ icon, children, testID }: UiEmptyStateProps) => (
  <View testID={testID} style={{ alignItems: "center", gap: 12 }}>
    {icon}
    <UiText style={{ textAlign: "center", fontSize: 18 }}>{children}</UiText>
  </View>
);

export default UiEmptyState;
