import { FontAwesome } from "@expo/vector-icons";
import { JSX } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Version can be specified in package.json

interface ListProperties {
  image;
  userUrl;
  username;
  packageName;
  packageVersion;
  licenses;
  repository;
  licenseUrl;
  parents;
}

interface LinkProperties {
  url?;
  style;
  children;
}

/**
 * Renders a list item for a license.
 * @param Properties The properties of the list item.
 * @returns The rendered list item.
 */
const LicensesListItem = (Properties: ListProperties): JSX.Element => {
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
    <View>
      <View style={styles.cardShadow}>
        <View style={styles.card}>
          {image && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => Linking.openURL(userUrl)}
            >
              <Image source={{ uri: image }} style={styles.image} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => Linking.openURL(repository)}
            style={styles.item}
          >
            <View style={{ maxWidth: "90%" }}>
              <Text style={styles.name}>{title}</Text>
              <Link style={styles.text} url={licenseUrl}>
                {licenses}
              </Link>
              <Link style={styles.text}>{packageVersion}</Link>
            </View>
            <FontAwesome
              style={{ alignSelf: "center" }}
              color={"#34495e"}
              size={16}
              name={"chevron-right"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const Link = (properties: LinkProperties) => {
  return (
    <Text
      style={properties.style}
      numberOfLines={1}
      onPress={() => properties.url && Linking.openURL(properties.url)}
    >
      {properties.children}
    </Text>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "stretch",
    backgroundColor: "white",
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
  },
  cardShadow: {
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  image: {
    borderRadius: 0,
    flex: 1,
    maxWidth: 96,
    width: 96,
  },
  item: {
    backgroundColor: "transparent",
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
    color: "#34495e",
    marginTop: 3,
  },
});

export default LicensesListItem;
