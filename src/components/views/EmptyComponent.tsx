import React, { type ReactNode } from "react";
import { View } from "react-native";

import { HeartIcon } from "#/components/Icons";
import UiCard from "#/components/ui/UiCard";
import UiEmptyState from "#/components/ui/UiEmptyState";
import UiText from "#/components/ui/UiText";
import Donate from "#/components/views/Donate";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

interface EmptyComponentProperties {
  text: string;
  icon: React.ReactElement<{ color?: string }>;
  onPress?: () => void;
  children?: ReactNode;
}

const EmptyComponent = ({
  text,
  icon,
  onPress,
  children,
}: EmptyComponentProperties) => {
  const corporate = useCorporateColor();

  return (
    <>
      <View style={{ marginVertical: spacing.huge }}>
        <UiEmptyState icon={icon} onPress={onPress}>
          {text}
        </UiEmptyState>
      </View>
      {children}
      <UiCard
        style={[
          globalStyles.centered,
          {
            marginBottom: spacing.huge,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.huge,
            gap: spacing.xl,
            overflow: "hidden",
          },
        ]}
      >
        <HeartIcon color={corporate} size={56} />
        <UiText size="lg">
          Unterstütze uns im unermüdlichen Kampf gegen Fake News und verzerrte
          Narrative
        </UiText>
        <Donate paypalAlways={true} />
      </UiCard>
    </>
  );
};

export default EmptyComponent;
