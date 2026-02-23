import { Image } from "expo-image";
import { Linking, Pressable } from "react-native";

import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { registerEvent } from "#/helpers/network/Analytics";

import ButtonVVPShop from "#assets/images/button_vvp_shop.webp";

interface ShopButtonProperties {
  article_link: string;
  location?: string;
}

const ShopButton = ({
  article_link,
  location = "ArticleBottom",
}: ShopButtonProperties) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        registerEvent(article_link, "Shop", { location });
        Linking.openURL(Config.donations.shop);
      }}
    >
      <Image style={styles.button} source={ButtonVVPShop} />
    </Pressable>
  );
};

export default ShopButton;
