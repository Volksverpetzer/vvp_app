import {
  PlatformPay,
  PlatformPayButton,
  confirmPlatformPayPayment,
} from "@stripe/stripe-react-native";
import Constants from "expo-constants";

import API from "#/helpers/network/ServerAPI";

interface StripeButtonProperties {
  amount: number;
  onSuccess?: () => void;
}

const StripeButton = (props: StripeButtonProperties) => {
  const { amount, onSuccess } = props;

  /**
   * Fetch the client secret from "payment/paymentIntent" endpoint
   */
  const fetchPaymentIntentClientSecret = async () => {
    const data = await API.paymentIntent(amount);
    return data.client_secret;
  };

  /**
   * Handle the payment process
   */
  const pay = async () => {
    const clientSecret = await fetchPaymentIntentClientSecret();
    const applePay: PlatformPay.ApplePayBaseParams = {
      cartItems: [
        {
          label: "Kaffeekasse " + Constants.expoConfig.name,
          amount: amount.toString(),
          paymentType: PlatformPay.PaymentType.Immediate,
        },
      ],
      merchantCountryCode: "DE",
      currencyCode: "EUR",
    };
    const result = await confirmPlatformPayPayment(clientSecret, {
      applePay,
    });
    if (result.error) {
      console.error(result.error);
      return;
    }
    onSuccess();
  };

  return (
    <PlatformPayButton
      onPress={pay}
      type={PlatformPay?.ButtonType?.Donate}
      appearance={PlatformPay?.ButtonStyle?.Black}
      borderRadius={4}
      style={{
        height: 40,
        width: 220,
        alignSelf: "center",
      }}
    />
  );
};

export default StripeButton;
