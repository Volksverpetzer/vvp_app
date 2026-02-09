import {
  PlatformPay,
  PlatformPayButton,
  confirmPlatformPayPayment,
  usePlatformPay,
} from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import API from "#/helpers/network/ServerAPI";

interface StripeButtonProperties {
  amount: number;
  onSuccess: () => void;
  onSupportChecked?: (isSupported: boolean) => void;
}

const StripeButton = (props: StripeButtonProperties) => {
  const { amount, onSuccess, onSupportChecked } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const { isPlatformPaySupported } = usePlatformPay();

  useEffect(() => {
    (async function checkSupport() {
      const supported = await isPlatformPaySupported();
      setIsSupported(supported);
      setIsLoading(false);
      onSupportChecked?.(supported);
    })();
  }, [isPlatformPaySupported, onSupportChecked]);

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

  // Show loading indicator while checking support
  if (isLoading) {
    return (
      <View
        style={{
          height: 40,
          width: 220,
          alignSelf: "center",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  // Don't render if Platform Pay is not supported
  if (!isSupported) {
    return null;
  }

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
