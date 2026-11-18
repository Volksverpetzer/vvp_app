import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { HeartIcon } from "#/components/Icons";
import Typography from "#/components/ui/Typography";
import UiModal from "#/components/ui/UiModal";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

import Donate from "./Donate";

interface SupportProperties {
  article_link: HttpsUrl;
}

const Support = ({ article_link }: SupportProperties) => {
  const [showBank, setShowBank] = useState(false);
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;
  const corporate = Colors[colorScheme].primary;

  const banktransfer = async () => {
    setShowBank(true);
    await Clipboard.setStringAsync(Config.donations.account.IBAN);
  };

  return (
    <View
      style={{
        backgroundColor: "transparent",
        gap: spacing.xl,
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <UiText
        size="xxxl"
        style={{
          color: Colors[colorScheme].text,
          textAlign: "center",
        }}
      >
        So kannst du uns unterstützen:
      </UiText>
      <Donate
        paypalAlways={true}
        background={backgroundColor}
        article_link={article_link}
      />
      <UiText size="base" style={{ textAlign: "center" }}>
        Du willst die Extrameile gehen?{"\n"}
        Damit jeder Cent bei uns ankommt,{"\n"}kannst du einen
      </UiText>
      <UiPressable
        accessibilityRole="button"
        onPress={banktransfer}
        style={{ padding: spacing.md }}
      >
        <Typography type="heading" style={{ color: corporate }}>
          Dauerauftrag
        </Typography>
      </UiPressable>
      <UiText size="base" style={{ textAlign: "center" }}>
        direkt bei der Bank einrichten.
      </UiText>
      <UiModal
        isVisible={showBank}
        onClose={() => setShowBank(false)}
        title="Banküberweisung"
        testID="bank-transfer"
      >
        <View style={styles.body}>
          <UiSpace size={spacing.lg} />
          <UiText size="base" style={styles.centered}>
            Wow! Du bist der Hammer! Danke für deine Mühe, wir wissen das echt
            zu schätzen
          </UiText>
          <UiSpace size={spacing.xl} />
          <UiText size="base" style={styles.centered}>
            IBAN ist in die Zwischenablage kopiert, hier nochmal zur Sicherheit:
          </UiText>
          <UiSpace size={spacing.xl} />
          <UiText selectable size="base" style={styles.centered}>
            Name: {Config.donations.account.holder} {`\n`}
            Bank: {Config.donations.account.bank} {`\n`}
            IBAN: {Config.donations.account.IBAN} {`\n`}
            Verwendungszweck: {Config.donations.account.note} {`\n`}
          </UiText>
          <HeartIcon color={corporate} size={iconSizes.lg} />
        </View>
      </UiModal>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    alignItems: "center",
    backgroundColor: "transparent",
  },
  centered: {
    textAlign: "center",
  },
});

export default Support;
