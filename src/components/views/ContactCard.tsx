import { useRouter } from "expo-router";
import { View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

interface ContactCardProperties {
  article_link: HttpsUrl;
}

/**
 * Card at the bottom of an article that links to the contact tab with
 * the article url prefilled in the form.
 */
const ContactCard = ({ article_link }: ContactCardProperties) => {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const { accent, text } = Colors[colorScheme];

  return (
    <View
      style={{
        backgroundColor: "transparent",
        gap: 20,
        alignItems: "center",
      }}
    >
      <UiText
        style={{
          color: text,
          fontSize: 30,
          textAlign: "center",
        }}
      >
        Etwas stimmt nicht?
      </UiText>
      <UiText size="base" style={{ textAlign: "center" }}>
        Du hast einen Fehler in diesem Artikel gefunden oder möchtest uns etwas
        dazu mitteilen?
      </UiText>
      <UiPressable
        accessibilityRole="button"
        accessibilityHint="Öffnet das Kontaktformular mit dem Artikel-Link"
        onPress={() =>
          router.push({
            pathname: "/(tabs)/contact",
            params: { category: "app_feedback", url: article_link },
          })
        }
        style={{
          alignItems: "center",
          backgroundColor: accent,
          borderRadius: 40,
          justifyContent: "center",
          paddingVertical: 10,
          width: 160,
        }}
      >
        <UiText
          size="lg"
          style={[globalStyles.whiteText, { textAlign: "center" }]}
        >
          Schreib uns
        </UiText>
      </UiPressable>
    </View>
  );
};

export default ContactCard;
