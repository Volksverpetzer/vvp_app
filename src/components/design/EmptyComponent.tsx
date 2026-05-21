import { WorldIcon } from "#/components/Icons";
import SteadyButton from "#/components/buttons/SteadyButton";
import Card from "#/components/design/Card";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Donate from "#/components/views/Donate";
import { globalStyles } from "#/constants/GlobalStyles";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

interface EmptyComponentProperties {
  reload?: () => void;
}

const EmptyComponent = ({ reload }: EmptyComponentProperties) => {
  const corporate = useCorporateColor();
  return (
    <Card
      style={[
        globalStyles.centered,
        { marginBottom: 80, gap: 20, overflow: "hidden" },
      ]}
    >
      <WorldIcon color={corporate} size={60} />
      {reload && (
        <>
          <UiText style={{ fontSize: 18, textAlign: "center" }}>
            Keine Ergebnisse. Versuche:
          </UiText>
          <UiPressable accessibilityRole="button" onPress={() => reload()}>
            <UiText style={{ fontSize: 18, color: corporate }}>
              Neu laden
            </UiText>
          </UiPressable>
        </>
      )}
      <UiText style={{ fontSize: 18 }}>
        Unterstütze uns im unermüdlichen Kampf gegen Fake News und verzerrte
        Narrative
      </UiText>
      <Donate paypalAlways={true} />
    </Card>
  );
};

export default EmptyComponent;
