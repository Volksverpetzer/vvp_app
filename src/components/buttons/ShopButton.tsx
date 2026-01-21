import { Image } from "expo-image";
import { Linking, Pressable } from "react-native";

import ButtonVVPShop from "../../../assets/images/ButtonVVPShop.png";
import Config from "../../constants/Config";
import { registerEvent } from "../../helpers/Networking/Analytics";

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
      <Image
        style={{
          width: 220,
          height: 40,
          borderRadius: 4,
        }}
        source={ButtonVVPShop}
      />
    </Pressable>
  );
};

export default ShopButton;
