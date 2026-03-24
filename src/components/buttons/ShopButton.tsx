import { Linking } from "react-native";

import UiButton from "#/components/ui/UiButton";
import Config from "#/constants/Config";
import { AppImages } from "#/helpers/AppImages";
import { registerEvent } from "#/helpers/network/Analytics";
import type { HttpsUrl } from "#/types";

interface ShopButtonProperties {
  article_link: HttpsUrl;
  location?: string;
}

const ShopButton = ({
  article_link,
  location = "ArticleBottom",
}: ShopButtonProperties) => {
  const shopUrl = Config.donations.shop;
  if (shopUrl) return null;

  return (
    <UiButton
      source={AppImages.shopButton}
      accessibilityLabel="Unseren Shop besuchen"
      accessibilityHint="Öffnet den Shop im Browser"
      onPress={() => {
        registerEvent(article_link, "Shop", { location });
        Linking.openURL(shopUrl);
      }}
    />
  );
};

export default ShopButton;
