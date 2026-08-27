import { Linking } from "react-native";

import UiImageButton from "#/components/ui/UiImageButton";
import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import type { HttpsUrl } from "#/types";

import ButtonSteady from "#assets/images/button_steady.webp";

interface SteadyButtonProperties {
  article_link?: HttpsUrl;
}

const SteadyButton = ({ article_link }: SteadyButtonProperties) => {
  const link = article_link ?? Config.wpUrl;
  return (
    <UiImageButton
      source={ButtonSteady}
      accessibilityLabel="Steady-Mitglied werden"
      accessibilityHint="Öffnet Steady im Browser"
      onPress={() => {
        registerEvent(link, "Steady");
        Linking.openURL(Config.donations.steady);
      }}
    />
  );
};

export default SteadyButton;
