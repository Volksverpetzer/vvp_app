import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as MailComposer from "expo-mail-composer";
import * as WebBrowser from "expo-web-browser";
import { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { ExternalLink } from "#/components/Icons";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

import Text from "./Text";

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
          backgroundColor: pressed ? "#909090" : undefined,
          paddingVertical: 10,
          justifyContent: "flex-start",
        },
      ]}
    >
      {properties.icon && <View style={{ width: 24 }}>{properties.icon}</View>}
      <Text
        style={{
          ...styles.heading,
        }}
      >
        {properties.text}
      </Text>
      <ExternalLink size={15} color={Colors[colorScheme].tabIconDefault} />
    </Pressable>
  );
};

export default DesignedLink;
