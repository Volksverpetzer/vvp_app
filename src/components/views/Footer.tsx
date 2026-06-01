import { View } from "react-native";

import { ShareIcon } from "#/components/Icons";
import Space from "#/components/design/Space";
import UiCard from "#/components/ui/UiCard";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

import Support from "./Support";

interface FooterProperties {
  article_link: HttpsUrl;
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
      <Space size={100} />
    </>
  );
};
export default Footer;
