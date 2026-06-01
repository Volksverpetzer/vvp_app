import React, { type ReactNode } from "react";
import { View } from "react-native";

import { HeartIcon } from "#/components/Icons";
import UiCard from "#/components/ui/UiCard";
import UiEmptyState from "#/components/ui/UiEmptyState";
import UiText from "#/components/ui/UiText";
import Donate from "#/components/views/Donate";
import { globalStyles } from "#/constants/GlobalStyles";
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
      <View style={{ marginVertical: 40 }}>
        <UiEmptyState icon={icon} onPress={onPress}>
          {text}
        </UiEmptyState>
      </View>
      {children}
      <UiCard
        style={[
          globalStyles.centered,
          {
            marginBottom: 40,
            paddingHorizontal: 20,
            paddingVertical: 40,
            gap: 20,
            overflow: "hidden",
          },
        ]}
      >
        <HeartIcon color={corporate} size={56} />
        <UiText style={{ fontSize: 18 }}>
          Unterstütze uns im unermüdlichen Kampf gegen Fake News und verzerrte
          Narrative
        </UiText>
        <Donate paypalAlways={true} />
      </UiCard>
    </>
  );
};

export default EmptyComponent;
