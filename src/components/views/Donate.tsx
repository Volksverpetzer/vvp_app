import {
  PlatformPay,
  PlatformPayButton,
  confirmPlatformPayPayment,
  usePlatformPay,
} from "@stripe/stripe-react-native";
import HorizontalPicker from "@vseslav/react-native-horizontal-picker";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import AnimatedSuccess from "#/components/animations/AnimatedSuccess";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { registerEvent } from "#/helpers/Networking/Analytics";
import API from "#/helpers/Networking/ServerAPI";
import { WEEK_IN_MS } from "#/helpers/utils/time";
import useAppColorScheme from "#/hooks/useAppColorScheme";

import Paypal from "#assets/images/ButtonPaypal.png";

interface DonateProperties {
  paypalAlways?: boolean; // Whether to always show the paypal button (if false, the button is only shown if platform pay is not supported)
  showPicker?: boolean; // Whether to show the amount picker
  background?: string; // The background color of the component
}

/**
 * @param properties - The properties for the Donate component
 * @returns The Donate component
 */
const Donate = (properties: DonateProperties) => {
  const [Loading, setLoading] = useState(true);
  const [isPaySupported, setIsPaySupported] = useState(false);
  const [amount, setAmount] = useState(10);
  const [successAnimated, setSuccessAnimated] = useState(false);
  const colorScheme = useAppColorScheme();
  const { isPlatformPaySupported } = usePlatformPay();
  const paypalAlways =
    properties?.paypalAlways || !Config.donations.platformPay;

  useEffect(() => {
    (async function () {
      setIsPaySupported(await isPlatformPaySupported());
      setLoading(false);
    })();
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
    setSuccessAnimated(true);
    setTimeout(() => setSuccessAnimated(false), 1500);
    logSuccess("Stripe");
  };

  // Neue Hilfsfunktion: ermittelt die PayPal-URL basierend auf amount
  const getPaypalUrlForAmount = (amount: number): string => {
    const entry = matrix.find((e) => Number(e?.amount) === amount);

    // Wenn ein kompletter Link angegeben ist, verwende ihn direkt
    if (entry && typeof entry.url === "string" && entry.url.length > 0) {
      return entry.url;
    }

    return Config.donations.paypal;
  };

  /**
   * Log a donation conversion event
   * @param method The payment method used
   */
  const logSuccess = (method: string) => {
    const wpUrl = Constants.expoConfig.extra.wpUrl;
    registerEvent(wpUrl + "/app", "DonateConversion", {
      method: method,
      amount: amount,
    });
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Danke für deine Spende! 📬",
        body: "Wir haben uns sehr gefreut, dass du uns im letzten Monat unterstützt hast.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + WEEK_IN_MS * 3),
      },
    });
  };

  if (Loading) {
    return (
      <View>
        <Text>Loading</Text>
      </View>
    );
  }
  const matrix = Config.donations?.paypalMatrix ?? [];
  const validAmounts = matrix
    .map((entry) => Number(entry?.amount))
    .filter((a): a is number => Number.isFinite(a) && a > 0);

  const background = properties?.background ?? Colors[colorScheme].background;
  const pickerColor =
    background.length > 4
      ? background
      : background + background.replace("#", "");
  const pickerColorText = Colors[colorScheme].text;
  const showPlatformPay =
    Config.donations.platformPay && isPaySupported && Platform.OS === "ios";
  return (
    <>
      <View style={{ justifyContent: "center", ...styles.noBackground }}>
        {(properties?.showPicker ?? true) && (
          <View
            style={{ height: 50, marginBottom: 20, ...styles.noBackground }}
          >
            <HorizontalPicker
              data={validAmounts}
              defaultIndex={validAmounts.indexOf(amount)}
              animatedScrollToDefaultIndex
              renderItem={(item) => {
                return (
                  <View
                    style={{
                      width: 80,
                      flex: 1,
                      justifyContent: "center",
                      ...styles.noBackground,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontSize: 18,
                        color: pickerColorText,
                      }}
                    >
                      {item}€
                    </Text>
                  </View>
                );
              }}
              itemWidth={80}
              onChange={(position) => {
                setAmount(validAmounts[position]);
              }}
            />
            <LinearGradient
              pointerEvents="none"
              style={{ ...StyleSheet.absoluteFillObject }}
              colors={[
                pickerColor,
                pickerColor + "aa",
                pickerColor + "00",
                pickerColor + "00",
                pickerColor + "aa",
                pickerColor,
              ]}
              locations={[0.1, 0.3, 0.45, 0.55, 0.7, 0.9]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        )}
        {showPlatformPay && (
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
        )}
        {paypalAlways && <Space size={20} />}
        {(!showPlatformPay || paypalAlways) && (
          //Pressable to open browser to pay with paypal with paypal logo
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              const url = getPaypalUrlForAmount(amount);
              Linking.openURL(url).then(() => {
                logSuccess("Paypal");
              });
            }}
          >
            <Image
              source={Paypal}
              style={{
                width: 220,
                height: 40,
                borderRadius: 4,
                borderWidth: 1,
                alignSelf: "center",
              }}
            />
          </Pressable>
        )}
      </View>
      <AnimatedSuccess animated={successAnimated} />
    </>
  );
};

export default Donate;
