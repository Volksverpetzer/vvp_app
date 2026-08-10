import { Image } from "expo-image";
import type { JSX, ReactNode } from "react";
import type { StyleProp, TextStyle } from "react-native";
import { Linking, StyleSheet, View } from "react-native";

import { ChevronIcon } from "#/components/Icons";
import UiCard from "#/components/ui/UiCard";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
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
  const styles = getStyles(Colors[colorScheme].surface);
  const textColor = Colors[colorScheme].text;
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
    <UiCard style={styles.card}>
      {image && (
        <UiPressable
          accessibilityRole="button"
          onPress={() => userUrl && Linking.openURL(userUrl)}
        >
          <Image
            source={{ uri: image }}
            style={styles.image}
            placeholder={LoadingImage}
          />
        </UiPressable>
      )}
      <UiPressable
        accessibilityRole="button"
        onPress={() => repository && Linking.openURL(repository)}
        style={styles.item}
      >
        <View style={styles.content}>
          <UiText
            size="base"
            style={[styles.name, { color: textColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </UiText>
          <Link style={[styles.text, { color: textColor }]} url={licenseUrl}>
            {licenses}
          </Link>
          <UiText size="base" bold style={[styles.name, { color: textColor }]}>
            {packageVersion}
          </UiText>
        </View>
        <View style={styles.icon}>
          <ChevronIcon
            direction="right"
            color={iconColor}
            size={iconSizes.lg}
          />
        </View>
      </UiPressable>
    </UiCard>
  );
};

const Link = (properties: LinkProperties) => {
  const colorScheme = useAppColorScheme();
  const defaultColor = Colors[colorScheme].text;

  return (
    <UiText
      style={[{ color: defaultColor }, properties.style]}
      numberOfLines={1}
      onPress={() => properties.url && Linking.openURL(properties.url)}
    >
      {properties.children}
    </UiText>
  );
};

const getStyles = (cardBackground: string) =>
  StyleSheet.create({
    card: {
      alignItems: "stretch",
      backgroundColor: cardBackground,
      flexDirection: "row",
      padding: 0,
      overflow: "hidden",
    },
    image: {
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
    },
    content: {
      flex: 1,
      minWidth: 0, // allow text to shrink
    },
    icon: {
      alignSelf: "center",
      flexShrink: 0, // ensure the icon isn't shrunk or pushed away
      marginLeft: spacing.sm,
    },
    name: {
      flexShrink: 1, // ensure the title can shrink instead of overflowing
    },
    text: {
      marginTop: spacing.xs,
    },
  });

export default LicensesListItem;
