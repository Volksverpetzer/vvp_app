import { Linking } from "react-native";

import UiButton from "#/components/ui/UiButton";
import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";

import ButtonVVPShop from "#assets/images/button_vvp_shop.webp";

interface ShopButtonProperties {
  article_link: string;
  location?: string;
}

const ShopButton = ({
  article_link,
  location = "ArticleBottom",
}: ShopButtonProperties) => (
  <UiButton
    source={ButtonVVPShop}
    onPress={() => {
      registerEvent(article_link, "Shop", { location });
      Linking.openURL(Config.donations.shop);
    }}
  />
);

export default ShopButton;
