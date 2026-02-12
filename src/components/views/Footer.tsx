import { Pressable } from "react-native";

import { Share } from "#/components/Icons";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

import Support from "./Support";

interface FooterProperties {
  article_link: string;
  onShare: (article_link: string, properties: unknown) => void;
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
          <Share color={"white"} size={50} />
        </Pressable>
      </View>
      <View
        style={{
          marginHorizontal: 12,
          paddingVertical: 12,
          borderRadius: 20,
          backgroundColor: Colors[colorScheme].secondaryBackground,
        }}
      >
        <Support article_link={properties.article_link} />
      </View>
      <Space size={95} />
    </>
  );
};
export default Footer;
