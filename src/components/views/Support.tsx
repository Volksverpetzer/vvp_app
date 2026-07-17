import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

import Donate from "./Donate";

interface SupportProperties {
  article_link: HttpsUrl;
}

const Support = ({ article_link }: SupportProperties) => {
  const [amount, setAmount] = useState(10);
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;
  const corporate = Colors[colorScheme].primary;

  const banktransfer = () => {
    router.push({
      pathname: "/bank-transfer",
      params: { amount: String(amount) },
    });
  };

  return (
    <View
      style={{
        backgroundColor: "transparent",
        gap: 20,
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <UiText
        style={{
          color: Colors[colorScheme].text,
          fontSize: 30,
          textAlign: "center",
        }}
      >
        So kannst du uns unterstützen:
      </UiText>
      <Donate
        paypalAlways={true}
        background={backgroundColor}
        article_link={article_link}
        onAmountChange={setAmount}
      />
      <UiText size="base" style={{ textAlign: "center" }}>
        Du willst die Extrameile gehen?{"\n"}
        Damit jeder Cent bei uns ankommt,{"\n"}kannst du einen
      </UiText>
      <UiPressable
        accessibilityRole="button"
        onPress={banktransfer}
        style={{ padding: 10 }}
      >
        <UiText bold size="lg" style={{ color: corporate }}>
          Dauerauftrag
        </UiText>
      </UiPressable>
      <UiText size="base" style={{ textAlign: "center" }}>
        direkt bei der Bank einrichten.
      </UiText>
    </View>
  );
};

export default Support;
