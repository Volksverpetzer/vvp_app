import { Pressable } from "react-native";

import { ShareIcon } from "#/components/Icons";
import Card from "#/components/design/Card";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

import Support from "./Support";

interface FooterProperties {
  article_link: HttpsUrl;
  onShare: (article_link: string, properties: object) => void;
}

/**
 * Renders the footer of an article
 * @param properties The properties of the footer
 * @returns The rendered footer
 */
const Footer = (properties: FooterProperties) => {
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;

  return (
    <>
      <View
        style={{
          paddingBottom: 30,
          alignItems: "center",
          ...styles.noBackground,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            paddingVertical: 30,
            fontSize: 18,
            color: corporate,
          }}
        >
          Überlass es nicht dem Algorithmus,{"\n"}ob deine Freunde{"\n"}von
          diesem Post erfahren:
        </Text>
        <Pressable
          accessibilityRole="button"
          style={{
            ...styles.centered,
            flex: 0,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: corporate,
            alignSelf: "center",
          }}
          onPress={() =>
            properties.onShare(properties.article_link, {
              location: "ArticleBottom",
            })
          }
        >
          <ShareIcon color={"white"} size={32} />
        </Pressable>
      </View>
      <Card
        style={{
          marginHorizontal: 12,
          backgroundColor: Colors[colorScheme].secondaryBackground,
        }}
      >
        <Support article_link={properties.article_link} />
      </Card>
      <Space size={100} />
    </>
  );
};
export default Footer;
