import { useRouter } from "expo-router";

import EmptyComponent from "#/components/design/EmptyComponent";
import View from "#/components/design/View";
import Heading from "#/components/typography/Heading";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { globalStyles } from "#/constants/GlobalStyles";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

const NotFoundScreen = () => {
  const corporate = useCorporateColor();
  const router = useRouter();
  return (
    <View style={[globalStyles.centered, { flexDirection: "column" }]}>
      <Heading style={{ textAlign: "center" }}>
        Hier könnte ein Artikel stehen. Tut er aber irgendwie nicht. Das ist
        wohl ein Fehler.
      </Heading>
      <UiPressable accessibilityRole="button" onPress={() => router.back()}>
        <UiText style={{ padding: 20, fontSize: 18, color: corporate }}>
          Zurück!
        </UiText>
      </UiPressable>
      <EmptyComponent />
    </View>
  );
};

export default NotFoundScreen;
