import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

import EmptyComponent from "#/components/design/EmptyComponent";
import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";
import { styles } from "#/constants/Styles";
import { useCorporateColor } from "#/hooks/useAppColorScheme";

const NotFoundScreen = () => {
  const corporate = useCorporateColor();
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: "column",
        ...styles.centered,
      }}
    >
      <UiText style={{ ...styles.heading, textAlign: "center" }}>
        Hier könnte ein Artikel stehen. Tut er aber irgendwie nicht. Das ist
        wohl ein Fehler.
      </UiText>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.back()}
      >
        <UiText style={{ padding: 20, fontSize: 18, color: corporate }}>
          Zurück!
        </UiText>
      </TouchableOpacity>
      <EmptyComponent />
    </View>
  );
};

export default NotFoundScreen;
