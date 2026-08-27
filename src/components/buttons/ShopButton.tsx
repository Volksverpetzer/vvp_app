import { Linking } from "react-native";

import UiImageButton from "#/components/ui/UiImageButton";
import Config from "#/constants/Config";
import { AppImages } from "#/helpers/AppImages";
import { registerEvent } from "#/helpers/network/Analytics";
import type { HttpsUrl } from "#/types";

interface ShopButtonProperties {
  article_link?: HttpsUrl;
}

const ShopButton = ({ article_link }: ShopButtonProperties) => {
  const shopUrl = Config.donations.shop;
  const link = article_link ?? Config.wpUrl;
  if (!shopUrl) return null;

  return (
    <UiImageButton
      source={AppImages.shopButton}
      accessibilityLabel="Unseren Shop besuchen"
      accessibilityHint="Öffnet den Shop im Browser"
      onPress={() => {
        registerEvent(link, "Shop");
        Linking.openURL(shopUrl);
      }}
    />
  );
};

export default ShopButton;
