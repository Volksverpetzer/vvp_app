import { View } from "react-native";

import { HeartIcon, WorldIcon } from "#/components/Icons";
import Card from "#/components/design/Card";
import UiEmptyState from "#/components/ui/UiEmptyState";
import UiText from "#/components/ui/UiText";
import Donate from "#/components/views/Donate";
import { globalStyles } from "#/constants/GlobalStyles";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

interface EmptyComponentProperties {
  text: string;
  onPress?: () => void;
}

const EmptyComponent = ({ text, onPress }: EmptyComponentProperties) => {
  const corporate = useCorporateColor();

  return (
    <>
      <View style={{ marginVertical: 40 }}>
        <UiEmptyState icon={<WorldIcon size={60} />} onPress={onPress}>
          {text}
        </UiEmptyState>
      </View>
      <Card
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
      </Card>
    </>
  );
};

export default EmptyComponent;
