import HorizontalPicker from "@vseslav/react-native-horizontal-picker";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import AnimatedSuccess from "#/components/animations/AnimatedSuccess";
import PaypalButton from "#/components/buttons/PaypalButton";
import StripeButton from "#/components/buttons/StripeButton";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { registerEvent } from "#/helpers/network/Analytics";
import { WEEK_IN_MS } from "#/helpers/utils/time";
import useAppColorScheme from "#/hooks/useAppColorScheme";

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
  const [amount, setAmount] = useState(10);
  const [successAnimated, setSuccessAnimated] = useState(false);
  const [isPlatformPaySupported, setIsPlatformPaySupported] = useState(true); // Assume supported until checked
  const colorScheme = useAppColorScheme();
  const paypalAlways =
    properties?.paypalAlways || !Config.donations.platformPay;
  const showPlatformPay = Platform.OS === "ios" && Config.donations.platformPay;

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
          <StripeButton
            amount={amount}
            onSuccess={() => {
              setSuccessAnimated(true);
              setTimeout(() => setSuccessAnimated(false), 1500);
              logSuccess("Stripe");
            }}
            onSupportChecked={(isSupported) => {
              setIsPlatformPaySupported(isSupported);
            }}
          />
        )}
        {paypalAlways && <Space size={20} />}
        {(!showPlatformPay || paypalAlways || !isPlatformPaySupported) && (
          <PaypalButton
            amount={amount}
            onSuccess={() => logSuccess("Paypal")}
          />
        )}
      </View>
      <AnimatedSuccess animated={successAnimated} />
    </>
  );
};

export default Donate;
