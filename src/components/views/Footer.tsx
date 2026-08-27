import { View } from "react-native";

import { ShareIcon } from "#/components/Icons";
import UiCard from "#/components/ui/UiCard";
import UiFab from "#/components/ui/UiFab";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
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
      <View style={{ paddingBottom: spacing.xxxl, alignItems: "center" }}>
        <UiText
          size="lg"
          style={{
            textAlign: "center",
            paddingVertical: spacing.xxxl,
            color: corporate,
          }}
        >
          Überlass es nicht dem Algorithmus,{"\n"}ob deine Freunde{"\n"}von
          diesem Post erfahren:
        </UiText>
        <UiFab
          size={80}
          style={{ alignSelf: "center" }}
          onPress={() =>
            properties.onShare(properties.article_link, {
              location: "ArticleBottom",
            })
          }
        >
          <ShareIcon color="white" size={iconSizes.lg} />
        </UiFab>
      </View>
      <View style={{ paddingHorizontal: spacing.md, gap: spacing.xl }}>
        <UiCard style={{ backgroundColor: Colors[colorScheme].surface }}>
          <Support article_link={properties.article_link} />
        </UiCard>
        <UiCard style={{ backgroundColor: Colors[colorScheme].surface }}>
          <ContactCard
            article_link={properties.article_link}
            article_title={properties.article_title}
          />
        </UiCard>
      </View>
    </>
  );
};
export default Footer;
