import { Linking } from "react-native";

import UiImageButton from "#/components/ui/UiImageButton";
import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import type { HttpsUrl } from "#/types";

import Paypal from "#assets/images/button_paypal.webp";

interface PaypalButtonProperties {
  amount: number;
  article_link?: HttpsUrl;
}

/**
 * Opens the PayPal donation page in the browser. The app never learns
 * whether the user actually paid there, so a tap is only tracked as a
 * "Paypal" click (like Steady/Shop) — not as a DonateConversion, and no
 * thank-you notification is scheduled.
 */
const PaypalButton = ({ amount, article_link }: PaypalButtonProperties) => {
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
    <UiImageButton
      source={Paypal}
      accessibilityLabel="Mit PayPal spenden"
      accessibilityHint="Öffnet PayPal im Browser"
      onPress={() => {
        const url = getPaypalUrlForAmount(amount);
        registerEvent(article_link ?? Config.wpUrl, "Paypal", { amount });
        Linking.openURL(url).catch((error) => {
          console.warn("PayPal: failed to open donation page", error);
        });
      }}
    />
  );
};

export default PaypalButton;
