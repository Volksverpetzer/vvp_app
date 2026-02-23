import { Image } from "expo-image";
import { Linking, Pressable } from "react-native";

import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";

import Paypal from "#assets/images/button_paypal.webp";

interface PaypalButtonProperties {
  amount: number;
  onSuccess: () => void;
}

const PaypalButton = ({ amount, onSuccess }: PaypalButtonProperties) => {
  const matrix = Config.donations?.paypalMatrix ?? [];

  /**
   * Ermittelt die PayPal-URL basierend auf amount
   * @param amount
   */
  const getPaypalUrlForAmount = (amount: number): string => {
    const entry = matrix.find((e) => Number(e?.amount) === amount);

    // Wenn ein kompletter Link angegeben ist, verwende ihn direkt
    if (entry && typeof entry.url === "string" && entry.url.length > 0) {
      return entry.url;
    }

    return Config.donations.paypal;
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        const url = getPaypalUrlForAmount(amount);
        Linking.openURL(url).then(() => {
          onSuccess();
        });
      }}
    >
      <Image source={Paypal} style={styles.button} />
    </Pressable>
  );
};

export default PaypalButton;
