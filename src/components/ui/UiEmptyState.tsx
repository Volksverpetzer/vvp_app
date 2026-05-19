import type { ReactNode } from "react";
import { View } from "react-native";

import UiText from "#/components/ui/UiText";
import { globalStyles } from "#/constants/GlobalStyles";

interface UiEmptyStateProps {
  icon: ReactNode;
  children: ReactNode;
}

const UiEmptyState = ({ icon, children }: UiEmptyStateProps) => (
  <View style={[globalStyles.centered, { gap: 12 }]}>
    {icon}
    <UiText style={{ textAlign: "center", fontSize: 18 }}>{children}</UiText>
  </View>
);

export default UiEmptyState;
