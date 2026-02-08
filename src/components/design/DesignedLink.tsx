import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as MailComposer from "expo-mail-composer";
import * as WebBrowser from "expo-web-browser";
import { ReactElement } from "react";
import { ImageSourcePropType, Pressable, TextStyle, View } from "react-native";

import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import useAppColorScheme from "#/hooks/useAppColorScheme";

import Text from "./Text";

type DesignedLinksProperties = {
  url: string;
  style?: TextStyle;
  text: string;
} & ({ asset: ImageSourcePropType } | { icon: ReactElement });

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
          backgroundColor: pressed ? "#909090" : undefined,
          ...styles.row,
          paddingVertical: 10,
          justifyContent: "flex-start",
        },
      ]}
    >
      {"asset" in properties && (
        <Image
          style={{ ...styles.iconLeft, top: 30 }}
          source={properties.asset}
        />
      )}
      {"icon" in properties && (
        <View style={{ ...styles.iconLeft }}>{properties.icon}</View>
      )}
      <Text
        style={{
          ...styles.heading,
          ...properties.style,
          paddingLeft: 30,
          paddingRight: 4,
        }}
      >
        {properties.text}
      </Text>
      <MaterialCommunityIcons
        name="arrow-top-right"
        size={13}
        color={Colors[colorScheme].tabIconDefault}
      />
    </Pressable>
  );
};

export default DesignedLink;
