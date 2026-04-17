import * as Linking from "expo-linking";
import * as MailComposer from "expo-mail-composer";
import * as WebBrowser from "expo-web-browser";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { ExternalLinkIcon } from "#/components/Icons";
import Heading from "#/components/typography/Heading";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type DesignedLinksProperties = {
  url: string;
  text: string;
} & { icon: ReactElement };

const DesignedLink = (properties: DesignedLinksProperties) => {
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
    <Pressable
      accessibilityRole="button"
      onPress={() => openLink()}
      style={({ pressed }) => [
        {
          ...styles.row,
          backgroundColor: pressed ? Colors[colorScheme].grayedOut : undefined,
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
        color={Colors[colorScheme].tabIconDefault}
        style={{ marginLeft: "auto" }}
      />
    </Pressable>
  );
};

export default DesignedLink;
