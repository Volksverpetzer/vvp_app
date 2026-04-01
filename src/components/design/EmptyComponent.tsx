import { Pressable } from "react-native";
import Text from "src/components/ui/Text";

import { WorldIcon } from "#/components/Icons";
import SteadyButton from "#/components/buttons/SteadyButton";
import Card from "#/components/design/Card";
import Donate from "#/components/views/Donate";
import { styles } from "#/constants/Styles";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

interface EmptyComponentProperties {
  reload?: () => void;
}

const EmptyComponent = ({ reload }: EmptyComponentProperties) => {
  const corporate = useCorporateColor();
  return (
    <Card
      style={{
        marginBottom: 80,
        gap: 20,
        ...styles.centered,
      }}
    >
      <WorldIcon color={corporate} size={60} />
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
    </Card>
  );
};

export default EmptyComponent;
