import {
  PlatformPay,
  PlatformPayButton,
  confirmPlatformPayPayment,
  usePlatformPay,
} from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { StripeButtonProperties } from "#/components/buttons/StripeButton";
import { styles as globalStyles } from "#/constants/Styles";
import API from "#/helpers/network/ServerAPI";

const styles = StyleSheet.create({
  loadingContainer: {
    height: 40,
    width: 220,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});

const StripeButton = (props: StripeButtonProperties) => {
  const { amount, onSuccess, onSupportChecked } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isPlatformPaySupported } = usePlatformPay();
  const onSupportCheckedRef = useRef(onSupportChecked);

  // Keep ref up to date
  useEffect(() => {
    onSupportCheckedRef.current = onSupportChecked;
  }, [onSupportChecked]);

  useEffect(() => {
    let mounted = true;

    const checkSupport = async () => {
      let supported = false;
      try {
        supported = await isPlatformPaySupported();
      } finally {
        if (mounted) {
          setIsSupported(supported);
          setIsLoading(false);
          onSupportCheckedRef.current?.(supported);
        }
      }
    };

    void checkSupport();

    return () => {
      mounted = false;
    };
  }, [isPlatformPaySupported]);

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
    // Prevent multiple concurrent payment flows
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    try {
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
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading indicator while checking support
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
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
      style={globalStyles.button}
      disabled={isProcessing}
    />
  );
};

export default StripeButton;
