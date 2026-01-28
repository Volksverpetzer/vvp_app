import { Pressable } from "react-native";

import { World } from "#/components/Icons";
import SteadyButton from "#/components/buttons/SteadyButton";
import View from "#/components/design/View";
import Donate from "#/components/views/Donate";
import { styles } from "#/constants/Styles";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

import Text from "./Text";

interface EmptyComponentProperties {
  reload?: () => void;
}

const EmptyComponent = ({ reload }: EmptyComponentProperties) => {
  const corporate = useCorporateColor();
  return (
    <View
      style={{
        paddingBottom: 48,
        paddingHorizontal: 24,
        gap: 24,
        ...styles.centered,
      }}
    >
      <World color={corporate} />
      {reload && (
        <>
          <Text style={{ fontSize: 18, textAlign: "center" }}>
            Keine Ergebnisse. Versuche:
          </Text>
          <Pressable accessibilityRole="button" onPress={() => reload()}>
            <Text style={{ fontSize: 18, color: corporate }}>Neu laden</Text>
          </Pressable>
        </>
      )}
      <Text style={{ fontSize: 18 }}>
        Unterstütze uns im unermüdlichen Kampf gegen Fake News und verzerrte
        Narrative
      </Text>
      <Donate paypalAlways={true} />
      <SteadyButton />
    </View>
  );
};

export default EmptyComponent;
