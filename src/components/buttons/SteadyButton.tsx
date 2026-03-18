import { Linking } from "react-native";

import UiButton from "#/components/ui/UiButton";
import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";

import ButtonSteady from "#assets/images/button_steady.webp";

interface SteadyButtonProperties {
  article_link?: string;
  location?: string;
}

const SteadyButton = ({
  article_link,
  location = "ArticleBottom",
}: SteadyButtonProperties) => {
  const link = article_link ?? Config.wpUrl;
  return (
    <UiButton
      source={ButtonSteady}
      onPress={() => {
        registerEvent(link, "Steady", { location });
        Linking.openURL(Config.donations.steady);
      }}
    />
  );
};

export default SteadyButton;
