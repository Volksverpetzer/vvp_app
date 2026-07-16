import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { Platform, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import QRCode from "react-native-qrcode-svg";

import { ExternalLinkIcon, HeartIcon } from "#/components/Icons";
import NavBar from "#/components/bars/NavBar";
import UiCard from "#/components/ui/UiCard";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { buildGiroCodePayload } from "#/helpers/utils/girocode";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const HEADER_HEIGHT = 50;

// The GiroCode is only useful where a second device scans the screen — i.e. the
// desktop web version. On a phone the user holds the only device, so we lead
// with the clipboard instead and hide the QR.
const showQrCode = Platform.OS === "web";

const BankTransferScreen = () => {
  // Amount pre-selected in the Donate picker (optional).
  const { amount } = useLocalSearchParams<{ amount?: string }>();
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;
  const corporate = Colors[colorScheme].primary;

  const parsedAmount = Number(amount);

  // EPC / GiroCode payload — generated on-device, nothing leaves the phone.
  const giroCode = useMemo(
    () =>
      buildGiroCodePayload({
        name: Config.donations.account.holder,
        iban: Config.donations.account.IBAN,
        remittance: Config.donations.account.note,
        amount: Number.isFinite(parsedAmount) ? parsedAmount : undefined,
      }),
    [parsedAmount],
  );

  // Copy the IBAN so a manual transfer is one paste away.
  useEffect(() => {
    void Clipboard.setStringAsync(Config.donations.account.IBAN);
  }, []);

  return (
    <View style={globalStyles.container}>
      <ScrollView
        style={{ flex: 1, backgroundColor }}
        contentContainerStyle={[
          globalStyles.content,
          { paddingTop: HEADER_HEIGHT, alignItems: "center" },
        ]}
      >
        <HeartIcon color={corporate} size={56} />
        <UiSpace size={20} />
        <UiText size="xxl">Banküberweisung</UiText>
        <UiSpace size={20} />
        <UiText size="base" style={{ textAlign: "center" }}>
          Wow! Du bist der Hammer! Danke für deine Mühe, wir wissen das echt zu
          schätzen
        </UiText>
        <UiSpace size={24} />
        {showQrCode ? (
          <>
            <UiText size="base" style={{ textAlign: "center" }}>
              Scanne diesen Code mit der Banking-App auf deinem Handy, um die
              Überweisung vorausgefüllt zu öffnen – daraus kannst du direkt
              einen Dauerauftrag machen:
            </UiText>
            <UiSpace size={16} />
            <View
              style={{
                backgroundColor: "#ffffff",
                padding: 16,
                borderRadius: 12,
              }}
            >
              <QRCode value={giroCode} size={220} />
            </View>
            <UiSpace size={24} />
            <UiText size="base" style={{ textAlign: "center" }}>
              Oder überweise manuell – die IBAN ist bereits in deiner
              Zwischenablage:
            </UiText>
          </>
        ) : (
          <UiCard
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              width: "100%",
            }}
          >
            <ExternalLinkIcon size={32} color={corporate} />
            <View style={{ flex: 1, backgroundColor: "transparent" }}>
              <UiText bold size="lg" style={{ color: corporate }}>
                Jetzt in deine Banking-App wechseln
              </UiText>
              <UiSpace size={4} />
              <UiText size="base">
                Die IBAN ist kopiert – dort einfügen und einen Dauerauftrag
                einrichten.
              </UiText>
            </View>
          </UiCard>
        )}
        {!showQrCode && (
          <>
            <UiSpace size={20} />
            <UiText size="base" style={{ textAlign: "center" }}>
              IBAN ist in die Zwischenablage kopiert, hier nochmal zur
              Sicherheit:
            </UiText>
          </>
        )}
        <UiSpace size={16} />
        <UiText selectable size="base" style={{ textAlign: "center" }}>
          Name: {Config.donations.account.holder} {`\n`}
          Bank: {Config.donations.account.bank} {`\n`}
          IBAN: {Config.donations.account.IBAN} {`\n`}
          Verwendungszweck: {Config.donations.account.note} {`\n`}
        </UiText>
        <UiSpace size={100} />
      </ScrollView>
      <NavBar />
    </View>
  );
};

export default BankTransferScreen;
