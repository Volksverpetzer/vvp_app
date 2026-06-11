import * as Linking from "expo-linking";
import * as MailComposer from "expo-mail-composer";
import * as WebBrowser from "expo-web-browser";
import type { ReactElement } from "react";
import { View } from "react-native";

import { ExternalLinkIcon } from "#/components/Icons";
import Heading from "#/components/typography/Heading";
import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface UiLinkProperties {
  url: string;
  text: string;
  icon: ReactElement;
}

const UiLink = (properties: UiLinkProperties) => {
  const colorScheme = useAppColorScheme();
  const openLink = () => {
    if ("mailto:" === properties.url.slice(0, 7)) {
      MailComposer.isAvailableAsync().then((isAvailable) => {
        if (isAvailable) {
          MailComposer.composeAsync({
            recipients: [properties.url.slice(7)],
          });
        } else {
          Linking.openURL(properties.url);
        }
      });
    } else {
      WebBrowser.openBrowserAsync(properties.url);
    }
  };

  return (
    <UiPressable
      accessibilityRole="button"
      onPress={() => openLink()}
      style={[
        globalStyles.row,
        {
          paddingVertical: 10,
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 10,
        },
      ]}
    >
      {properties.icon && <View style={{ width: 24 }}>{properties.icon}</View>}
      <Heading style={{ color: Colors[colorScheme].text }}>
        {properties.text}
      </Heading>
      <ExternalLinkIcon
        color={Colors[colorScheme].iconMuted}
        style={{ marginLeft: "auto" }}
      />
    </UiPressable>
  );
};

export default UiLink;
