import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import type { ScrollViewInstance } from "react-native";

import AnimatedSuccess from "#/components/animations/AnimatedSuccess";
import PaypalButton from "#/components/buttons/PaypalButton";
import ShopButton from "#/components/buttons/ShopButton";
import SteadyButton from "#/components/buttons/SteadyButton";
import StripeButton from "#/components/buttons/StripeButton";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { fontFamily } from "#/constants/FontFamily";
import { spacing } from "#/constants/Spacing";
import NotificationManager from "#/helpers/Notifications";
import { registerEvent } from "#/helpers/network/Analytics";
import { WEEK_IN_MS } from "#/helpers/utils/time";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

const ITEM_WIDTH = 80;

interface DonateProperties {
  paypalAlways?: boolean;
  showPicker?: boolean;
  background?: string;
  article_link?: HttpsUrl;
}

const Donate = ({ article_link, ...properties }: DonateProperties) => {
  const [amount, setAmount] = useState(10);
  const [pickerWidth, setPickerWidth] = useState(0);
  const [successAnimated, setSuccessAnimated] = useState(false);
  const [isPlatformPaySupported, setIsPlatformPaySupported] = useState(true);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const colorScheme = useAppColorScheme();
  const paypalAlways =
    properties?.paypalAlways || !Config.donations.platformPay;
  const showPlatformPay = Platform.OS === "ios" && Config.donations.platformPay;

  const handleSupportChecked = useCallback((isSupported: boolean) => {
    setIsPlatformPaySupported(isSupported);
  }, []);

  const logSuccess = (method: string) => {
    registerEvent(
      Constants.expoConfig.extra.wpUrl + "/app",
      "DonateConversion",
      { method, amount },
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

  const padding = Math.max(0, (pickerWidth - ITEM_WIDTH) / 2);

  // Pick the amount centred at this scroll offset.
  const selectAtOffset = (offsetX: number) => {
    const selected = validAmounts[Math.round(offsetX / ITEM_WIDTH)];
    if (selected !== undefined) setAmount(selected);
  };

  // Tapping an amount selects it and centres it; works everywhere and is the
  // only way to pick one with a screen reader.
  const selectAmount = (value: number, index: number) => {
    setAmount(value);
    scrollRef.current?.scrollTo({ x: index * ITEM_WIDTH, animated: true });
  };
  const initialIndex = validAmounts.indexOf(amount);

  // Scroll to the default amount once the picker has measured its width
  useEffect(() => {
    if (pickerWidth > 0 && initialIndex !== -1) {
      scrollRef.current?.scrollTo({
        x: initialIndex * ITEM_WIDTH,
        animated: false,
      });
    }
  }, [pickerWidth, initialIndex]);

  const background = properties?.background ?? Colors[colorScheme].background;
  const pickerColor =
    background.length > 4
      ? background
      : background + background.replace("#", "");
  const pickerColorText = Colors[colorScheme].text;
  // Highlight the chosen amount: on wide screens (web, tablets) every amount
  // fits, nothing scrolls, so the centre gradient gives no feedback.
  const pickerColorSelected = Colors[colorScheme].primary;

  return (
    <>
      <View
        style={{
          alignItems: "center",
          backgroundColor: "transparent",
          gap: spacing.xl,
        }}
      >
        {(properties?.showPicker ?? true) && (
          <View
            style={{
              height: 50,
              marginBottom: spacing.md,
              backgroundColor: "transparent",
            }}
            onLayout={(e) => setPickerWidth(e.nativeEvent.layout.width)}
          >
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_WIDTH}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: padding }}
              onMomentumScrollEnd={(e) =>
                selectAtOffset(e.nativeEvent.contentOffset.x)
              }
              // react-native-web never fires onMomentumScrollEnd (and has no
              // snapToInterval), so the amount stayed at the 10€ default on
              // web; follow the scroll position there instead.
              onScroll={
                Platform.OS === "web"
                  ? (e) => selectAtOffset(e.nativeEvent.contentOffset.x)
                  : undefined
              }
              scrollEventThrottle={Platform.OS === "web" ? 16 : undefined}
            >
              {validAmounts.map((item, index) => (
                <UiPressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={`${item} Euro`}
                  accessibilityHint="Wählt diesen Spendenbetrag aus"
                  accessibilityState={{ selected: item === amount }}
                  onPress={() => selectAmount(item, index)}
                  style={{
                    width: ITEM_WIDTH,
                    height: 50,
                    justifyContent: "center",
                    backgroundColor: "transparent",
                  }}
                >
                  <UiText
                    size="lg"
                    style={{
                      textAlign: "center",
                      color:
                        item === amount ? pickerColorSelected : pickerColorText,
                      fontFamily:
                        item === amount ? fontFamily.bold : fontFamily.regular,
                    }}
                  >
                    {item}€
                  </UiText>
                </UiPressable>
              ))}
            </ScrollView>
            <LinearGradient
              style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
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
          <PaypalButton amount={amount} article_link={article_link} />
        )}
        <SteadyButton article_link={article_link} />
        <ShopButton article_link={article_link} />
      </View>
      <AnimatedSuccess animated={successAnimated} />
    </>
  );
};

export default Donate;
