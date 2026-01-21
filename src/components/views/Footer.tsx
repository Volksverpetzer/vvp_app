import { Pressable } from "react-native";

import Colors from "../../constants/Colors";
import { styles } from "../../constants/Styles";
import useColorScheme from "../../hooks/useColorScheme";
import { Share } from "../Icons";
import Space from "../design/Space";
import Text from "../design/Text";
import View from "../design/View";
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
  const colorScheme = useColorScheme();
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
          <Share color={"#fcfcfc"} size={50} />
        </Pressable>
      </View>
      <Support article_link={properties.article_link} />
      <Space size={95} />
    </>
  );
};
export default Footer;
