import { Image } from "expo-image";
import type { JSX, ReactNode } from "react";
import type { StyleProp, TextStyle } from "react-native";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ChevronIcon } from "#/components/Icons";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

import LoadingImage from "#assets/images/logo_animated.gif";

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
            <Image
              source={{ uri: image }}
              style={styles.image}
              placeholder={LoadingImage}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => repository && Linking.openURL(repository)}
          style={styles.item}
        >
          <View style={styles.content}>
            <Text
              style={[styles.name, { color: textColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            <Link style={[styles.text, { color: textColor }]} url={licenseUrl}>
              {licenses}
            </Link>
            <Text style={[styles.name, { color: textColor }]}>
              {packageVersion}
            </Text>
          </View>
          <View style={styles.icon}>
            <ChevronIcon direction="right" color={iconColor} size={32} />
          </View>
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
      flexWrap: "nowrap",
      justifyContent: "space-between",
      alignItems: "center",
      maxWidth: "100%",
      paddingHorizontal: 12,
      paddingVertical: 16,
    },
    content: {
      flex: 1,
      minWidth: 0, // allow text to shrink
    },
    icon: {
      alignSelf: "center",
      flexShrink: 0, // ensure the icon isn't shrunk or pushed away
      marginLeft: 8,
    },
    name: {
      fontSize: 16,
      fontWeight: "bold",
      flexShrink: 1, // ensure the title can shrink instead of overflowing
    },
    text: {
      marginTop: 3,
    },
  });

export default LicensesListItem;
