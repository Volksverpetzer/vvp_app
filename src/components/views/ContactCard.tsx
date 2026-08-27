import { useRouter } from "expo-router";
import { View } from "react-native";

import UiButton from "#/components/ui/UiButton";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

interface ContactCardProperties {
  article_link: HttpsUrl;
  article_title?: string;
}

/**
 * Card at the bottom of an article that links to the contact tab with
 * the article url (and title, when available) prefilled in the form.
 */
const ContactCard = ({
  article_link,
  article_title,
}: ContactCardProperties) => {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const { text } = Colors[colorScheme];

  return (
    <View
      style={{
        backgroundColor: "transparent",
        gap: spacing.xl,
        alignItems: "center",
      }}
    >
      <UiText
        size="xxl"
        style={{
          color: text,
          textAlign: "center",
        }}
      >
        Etwas stimmt nicht?
      </UiText>
      <UiText size="base" style={{ textAlign: "center" }}>
        Du hast einen Fehler in diesem Artikel gefunden oder möchtest uns etwas
        dazu mitteilen?
      </UiText>
      <UiButton
        label="Schreib uns"
        variant="accent"
        shape="pill"
        accessibilityHint="Öffnet das Kontaktformular mit dem Artikel-Link"
        onPress={() =>
          router.push({
            pathname: "/(tabs)/contact",
            params: {
              category: "app_feedback",
              url: article_link,
              ...(article_title ? { title: article_title } : {}),
            },
          })
        }
        style={{ width: 160 }}
      />
    </View>
  );
};

export default ContactCard;
