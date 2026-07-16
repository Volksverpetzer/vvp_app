import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { View } from "react-native";
import Modal from "react-native-modal";
import QRCode from "react-native-qrcode-svg";

import { CloseIcon, HeartIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { buildGiroCodePayload } from "#/helpers/utils/girocode";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

import Donate from "./Donate";

interface SupportProperties {
  article_link: HttpsUrl;
}

const Support = ({ article_link }: SupportProperties) => {
  const [showBank, setShowBank] = useState(false);
  const [amount, setAmount] = useState(10);
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;
  const corporate = Colors[colorScheme].primary;

  // EPC / GiroCode payload — generated on-device, nothing leaves the phone.
  const giroCode = useMemo(
    () =>
      buildGiroCodePayload({
        name: Config.donations.account.holder,
        iban: Config.donations.account.IBAN,
        remittance: Config.donations.account.note,
        amount,
      }),
    [amount],
  );

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
      <Modal
        isVisible={showBank}
        onSwipeComplete={() => setShowBank(false)}
        swipeDirection={["down", "up"]}
      >
        <View
          style={{
            padding: 20,
            alignItems: "center",
            backgroundColor,
            borderRadius: 16,
          }}
        >
          <View
            style={{
              width: "100%",
              justifyContent: "flex-end",
              alignItems: "flex-end",
              padding: 5,
            }}
          >
            <UiPressable
              accessibilityRole="button"
              onPress={() => setShowBank(false)}
            >
              <CloseIcon size={48} color={corporate} />
            </UiPressable>
          </View>
          <UiText size="xxl">Banküberweisung</UiText>
          <UiSpace size={20} />
          <UiText size="base" style={{ textAlign: "center" }}>
            Wow! Du bist der Hammer! Danke für deine Mühe, wir wissen das echt
            zu schätzen
          </UiText>
          <UiSpace size={20} />
          <UiText size="base" style={{ textAlign: "center" }}>
            IBAN ist in die Zwischenablage kopiert, hier nochmal zur Sicherheit:
          </UiText>
          <UiSpace size={20} />
          <UiText selectable size="base" style={{ textAlign: "center" }}>
            Name: {Config.donations.account.holder} {`\n`}
            Bank: {Config.donations.account.bank} {`\n`}
            IBAN: {Config.donations.account.IBAN} {`\n`}
            Verwendungszweck: {Config.donations.account.note} {`\n`}
          </UiText>
          <UiSpace size={20} />
          <UiText size="base" style={{ textAlign: "center" }}>
            Oder scanne diesen Code mit deiner Banking-App, um die Überweisung
            vorausgefüllt zu öffnen:
          </UiText>
          <UiSpace size={16} />
          <View
            style={{
              backgroundColor: "#ffffff",
              padding: 16,
              borderRadius: 12,
            }}
          >
            <QRCode value={giroCode} size={200} />
          </View>
          <UiSpace size={20} />
          <HeartIcon color={corporate} size={32} />
        </View>
      </Modal>
    </View>
  );
};

export default Support;
