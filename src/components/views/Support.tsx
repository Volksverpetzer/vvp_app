import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Pressable } from "react-native";
import Modal from "react-native-modal";

import { CloseIcon, HeartIcon } from "#/components/Icons";
import ShopButton from "#/components/buttons/ShopButton";
import SteadyButton from "#/components/buttons/SteadyButton";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

import Donate from "./Donate";

interface SupportProperties {
  article_link: HttpsUrl;
  location?: string;
}

const Support = ({ article_link, location }: SupportProperties) => {
  const [showBank, setShowBank] = useState(false);
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].secondaryBackground;
  const corporate = Colors[colorScheme].corporate;

  const banktransfer = async () => {
    setShowBank(true);
    await Clipboard.setStringAsync(Config.donations.account.IBAN);
  };

  return (
    <View
      style={{
        backgroundColor: "transparent",
        gap: 20,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: Colors[colorScheme].text,
          fontSize: 30,
          textAlign: "center",
        }}
      >
        So kannst du uns unterstützen:
      </Text>
      <Donate paypalAlways={true} background={backgroundColor} />
      <SteadyButton article_link={article_link} location={location} />
      <ShopButton article_link={article_link} location={location} />
      <Text style={{ textAlign: "center", fontSize: 16 }}>
        Du willst die Extrameile gehen?{"\n"}
        Damit jeder Cent bei uns ankommt,{"\n"}kannst du einen
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={banktransfer}
        style={{ padding: 10 }}
      >
        <Text style={{ ...styles.heading, color: corporate, padding: 0 }}>
          Dauerauftrag
        </Text>
      </Pressable>
      <Text style={{ textAlign: "center", fontSize: 16 }}>
        direkt bei der Bank einrichten.
      </Text>
      <Modal
        isVisible={showBank}
        onSwipeComplete={() => setShowBank(false)}
        swipeDirection={["down", "up"]}
      >
        <View style={{ padding: 20, alignItems: "center" }}>
          <View
            style={{
              width: "100%",
              justifyContent: "flex-end",
              alignItems: "flex-end",
              padding: 5,
            }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowBank(false)}
            >
              <CloseIcon size={48} color={corporate} />
            </Pressable>
          </View>
          <Text style={{ fontSize: 25 }}>Banküberweisung</Text>
          <Space size={20} />
          <Text style={{ fontSize: 16, textAlign: "center" }}>
            Wow! Du bist der Hammer! Danke für deine Mühe, wir wissen das echt
            zu schätzen
          </Text>
          <Space size={20} />
          <Text style={{ fontSize: 16, textAlign: "center" }}>
            IBAN ist in die Zwischenablage kopiert, hier nochmal zur Sicherheit:
          </Text>
          <Space size={20} />
          <Text selectable style={{ fontSize: 16, textAlign: "center" }}>
            Name: {Config.donations.account.holder} {`\n`}
            Bank: {Config.donations.account.bank} {`\n`}
            IBAN: {Config.donations.account.IBAN} {`\n`}
            Verwendungszweck: {Config.donations.account.note} {`\n`}
          </Text>
          <HeartIcon color={corporate} size={32} />
        </View>
      </Modal>
    </View>
  );
};

export default Support;
