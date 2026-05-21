import HorizontalPicker from "@vseslav/react-native-horizontal-picker";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import AnimatedSuccess from "#/components/animations/AnimatedSuccess";
import PaypalButton from "#/components/buttons/PaypalButton";
import ShopButton from "#/components/buttons/ShopButton";
import SteadyButton from "#/components/buttons/SteadyButton";
import StripeButton from "#/components/buttons/StripeButton";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import NotificationManager from "#/helpers/Notifications";
import { registerEvent } from "#/helpers/network/Analytics";
import { WEEK_IN_MS } from "#/helpers/utils/time";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

interface DonateProperties {
  paypalAlways?: boolean; // Whether to always show the paypal button (if false, the button is only shown if platform pay is not supported)
  showPicker?: boolean; // Whether to show the amount picker
  background?: string; // The background color of the component
  article_link?: HttpsUrl; // Forwarded to SteadyButton and ShopButton for analytics tracking
}

/**
 * @param article_link
 * @param properties - The properties for the Donate component
 * @returns The Donate component
 */
const Donate = ({ article_link, ...properties }: DonateProperties) => {
  const [amount, setAmount] = useState(10);
  const [successAnimated, setSuccessAnimated] = useState(false);
  const [isPlatformPaySupported, setIsPlatformPaySupported] = useState(true); // Assume supported until checked
  const colorScheme = useAppColorScheme();
  const paypalAlways =
    properties?.paypalAlways || !Config.donations.platformPay;
  const showPlatformPay = Platform.OS === "ios" && Config.donations.platformPay;

  /**
   * Callback to handle Platform Pay support check result
   */
  const handleSupportChecked = useCallback((isSupported: boolean) => {
    setIsPlatformPaySupported(isSupported);
  }, []);

  /**
   * Log a donation conversion event
   * @param method The payment method used
   */
  const logSuccess = (method: string) => {
    registerEvent(
      Constants.expoConfig.extra.wpUrl + "/app",
      "DonateConversion",
      {
        method: method,
        amount: amount,
      },
    );

    if (Platform.OS !== "web") {
      void NotificationManager.scheduleDonationReminder(
        new Date(Date.now() + WEEK_IN_MS * 3),
      );
    }
  };

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
  return (
    <>
      <View
        style={{
          alignItems: "center",
          backgroundColor: "transparent",
          gap: 20,
        }}
      >
        {(properties?.showPicker ?? true) && (
          <View
            style={{
              height: 50,
              marginBottom: 10,
              backgroundColor: "transparent",
            }}
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
                      backgroundColor: "transparent",
                    }}
                  >
                    <UiText
                      style={{
                        textAlign: "center",
                        fontSize: 18,
                        color: pickerColorText,
                      }}
                    >
                      {item}€
                    </UiText>
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
          <StripeButton
            amount={amount}
            onSuccess={() => {
              setSuccessAnimated(true);
              setTimeout(() => setSuccessAnimated(false), 1500);
              logSuccess("Stripe");
            }}
            onSupportChecked={handleSupportChecked}
          />
        )}
        {(!showPlatformPay || paypalAlways || !isPlatformPaySupported) && (
          <PaypalButton
            amount={amount}
            onSuccess={() => logSuccess("Paypal")}
          />
        )}
        <SteadyButton article_link={article_link} />
        <ShopButton article_link={article_link} />
      </View>
      <AnimatedSuccess animated={successAnimated} />
    </>
  );
};

export default Donate;
