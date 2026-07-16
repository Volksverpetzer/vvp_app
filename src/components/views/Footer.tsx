import { View } from "react-native";

import { ShareIcon } from "#/components/Icons";
import UiCard from "#/components/ui/UiCard";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

import ContactCard from "./ContactCard";
import Support from "./Support";

interface FooterProperties {
  article_link: HttpsUrl;
  article_title?: string;
  onShare: (article_link: string, properties: Record<string, unknown>) => void;
}

/**
 * Renders the footer of an article
 * @param properties The properties of the footer
 * @returns The rendered footer
 */
const Footer = (properties: FooterProperties) => {
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;

  return (
    <>
      <View style={{ paddingBottom: 30, alignItems: "center" }}>
        <UiText
          style={{
            textAlign: "center",
            paddingVertical: 30,
            fontSize: 18,
            color: corporate,
          }}
        >
          Überlass es nicht dem Algorithmus,{"\n"}ob deine Freunde{"\n"}von
          diesem Post erfahren:
        </UiText>
        <UiPressable
          accessibilityRole="button"
          style={[
            globalStyles.centered,
            {
              flex: 0,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: corporate,
              alignSelf: "center",
            },
          ]}
          onPress={() =>
            properties.onShare(properties.article_link, {
              location: "ArticleBottom",
            })
          }
        >
          <ShareIcon color="white" size={32} />
        </UiPressable>
      </View>
      <UiCard
        style={{
          marginHorizontal: 12,
          backgroundColor: Colors[colorScheme].surface,
        }}
      >
        <Support article_link={properties.article_link} />
      </UiCard>
      <UiSpace size={20} />
      <UiCard
        style={{
          marginHorizontal: 12,
          backgroundColor: Colors[colorScheme].surface,
        }}
      >
        <ContactCard
          article_link={properties.article_link}
          article_title={properties.article_title}
        />
      </UiCard>
      <UiSpace size={100} />
    </>
  );
};
export default Footer;
