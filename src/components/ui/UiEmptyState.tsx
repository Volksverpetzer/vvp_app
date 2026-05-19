import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";

import UiText from "#/components/ui/UiText";
import { globalStyles } from "#/constants/GlobalStyles";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

interface UiEmptyStateProps {
  icon: (color: string) => ReactElement;
  children: ReactNode;
}

const UiEmptyState = ({ icon, children }: UiEmptyStateProps) => {
  const corporate = useCorporateColor();

  return (
    <View style={[globalStyles.centered, { gap: 12 }]}>
      {icon(corporate)}
      <UiText style={{ textAlign: "center", fontSize: 18 }}>{children}</UiText>
    </View>
  );
};

export default UiEmptyState;
