import { Image } from "expo-image";
import { Linking, Pressable } from "react-native";

import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { registerEvent } from "#/helpers/network/Analytics";

import ButtonSteady from "#assets/images/button_steady.webp";

interface SteadyButtonProperties {
  article_link?: string;
  location?: string;
}

/**
 * SteadyButton is a button that opens the Steady donation page.
 * @param properties
 */
const SteadyButton = (properties: SteadyButtonProperties) => {
  const article_link = properties.article_link ?? Config.wpUrl;
  const location = properties.location ?? "ArticleBottom";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        registerEvent(article_link, "Steady", { location });
        Linking.openURL(Config.donations.steady);
      }}
    >
      <Image style={styles.button} source={ButtonSteady} />
    </Pressable>
  );
};

export default SteadyButton;
