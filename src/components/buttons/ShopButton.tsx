import { Linking } from "react-native";

import UiButton from "#/components/ui/UiButton";
import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import { AppImages } from "#/helpers/utils/AppImages";

interface ShopButtonProperties {
  article_link: string;
  location?: string;
}

const ShopButton = ({
  article_link,
  location = "ArticleBottom",
}: ShopButtonProperties) => {
  if (!AppImages.shopButton) return null;

  return (
    <UiButton
      source={AppImages.shopButton}
      accessibilityLabel="Unseren Shop besuchen"
      accessibilityHint="Öffnet den Shop im Browser"
      onPress={() => {
        registerEvent(article_link, "Shop", { location });
        Linking.openURL(Config.donations.shop);
      }}
    />
  );
};

export default ShopButton;
