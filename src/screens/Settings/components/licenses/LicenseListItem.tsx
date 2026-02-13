import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { JSX, ReactNode } from "react";
import {
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface LicensesListItemProperties {
  image?: string;
  userUrl?: string;
  username?: string;
  packageName: string;
  packageVersion?: string;
  licenses?: string;
  repository?: string;
  licenseUrl?: string;
  parents?: string[];
}

interface LinkProperties {
  url?: string;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}

/**
 * Renders a list item for a license.
 * @param Properties The properties of the list item.
 * @returns The rendered list item.
 */
const LicensesListItem = (
  Properties: LicensesListItemProperties,
): JSX.Element => {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark);
  const textColor = isDark ? "#e5e7eb" : "#34495e";
  const iconColor = textColor;
  const {
    image,
    userUrl,
    username,
    packageName,
    packageVersion,
    licenses,
    repository,
    licenseUrl,
  } = Properties;

  let title = packageName;
  if (username && title.toLowerCase() !== username.toLowerCase()) {
    title += ` by ${username}`;
  }

  return (
    <View style={styles.cardShadow}>
      <View style={styles.card}>
        {image && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => userUrl && Linking.openURL(userUrl)}
          >
            <Image source={{ uri: image }} style={styles.image} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => repository && Linking.openURL(repository)}
          style={styles.item}
        >
          <View>
            <Text style={[styles.name, { color: textColor }]}>{title}</Text>
            <Link style={[styles.text, { color: textColor }]} url={licenseUrl}>
              {licenses}
            </Link>
            <Text style={[styles.name, { color: textColor }]}>
              {packageVersion}
            </Text>
          </View>
          <FontAwesome
            style={{ alignSelf: "center" }}
            color={iconColor}
            size={16}
            name={"chevron-right"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Link = (properties: LinkProperties) => {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const defaultColor = isDark ? "#e5e7eb" : "#34495e";

  return (
    <Text
      style={[{ color: defaultColor }, properties.style]}
      numberOfLines={1}
      onPress={() => properties.url && Linking.openURL(properties.url)}
    >
      {properties.children}
    </Text>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      alignItems: "stretch",
      backgroundColor: isDark ? "#111827" : "#fff",
      borderRadius: 4,
      flexDirection: "row",
      overflow: "hidden",
    },
    cardShadow: {
      marginHorizontal: 12,
      marginVertical: 6,
    },
    image: {
      borderRadius: 0,
      flex: 1,
      maxWidth: 96,
      width: 96,
    },
    item: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      maxWidth: "100%",
      paddingHorizontal: 12,
      paddingVertical: 16,
    },
    name: {
      fontSize: 16,
      fontWeight: "bold",
    },
    text: {
      marginTop: 3,
    },
  });

export default LicensesListItem;
