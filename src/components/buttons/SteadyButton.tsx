import { Image } from "expo-image";
import { Linking, Pressable } from "react-native";

import ButtonSteady from "../../../assets/images/ButtonSteady.png";
import Config from "../../constants/Config";
import { registerEvent } from "../../helpers/Networking/Analytics";

interface SteadyButtonProperties {
  article_link?: string;
  location?: string;
}

/**
 * SteadyButton is a button that opens the Steady donation page.
 * @param article_link - The link to the article that was shared.
 * @param location - The location where the button was pressed for analytics.
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
      <Image
        style={{
          width: 220,
          height: 40,
          borderRadius: 4,
        }}
        source={ButtonSteady}
      />
    </Pressable>
  );
};

export default SteadyButton;
