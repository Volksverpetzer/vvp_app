import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronIcon } from "#/components/Icons";
import FavCounter from "#/components/counter/FavCounter";
import ShareCounter from "#/components/counter/ShareCounter";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { onShare } from "#/helpers/Sharing";
import { hexToRgb } from "#/helpers/utils/color";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { FaveableType, HttpsUrl, ShareableType } from "#/types";

interface NavBarProperties {
  link?: HttpsUrl;
  shareable?: ShareableType[];
  contentFavIdentifier?: string;
  contentType?: FaveableType;
}
/**
 * NavBar component renders a top navigation bar with a customizable
 * share button and a back button. The component uses a linear gradient
 * background that adapts to the current color scheme. It also respects
 * safe area insets for a better UI display on different devices.
 * It uses absolute position, so don't use in ScrollView.
 *
 * Props:
 * - link: The URL to be shared when the share button is pressed. If none is provided, we don't show the share button.
 * - shareable: An array of ShareableType objects
 * - contentFavIdentifier: The identifier for local Storage of the Fav
 * - contentType: The type of the content you want to favorite.
 *
 * The back button is represented with a chevron icon and navigates
 * back to the previous screen when pressed. If the share button is
 * visible, it displays the share count and allows the link to be shared.
 */
const NavBar = (properties: NavBarProperties) => {
  const { contentFavIdentifier, contentType, link, shareable } = properties;
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const backgroundColor = Colors[colorScheme].background;
  const insets = useSafeAreaInsets();

  const [r, g, b] = hexToRgb(backgroundColor);

  return (
    <View
      style={{
        backgroundColor: backgroundColor,
        position: "relative",
        flexGrow: 0,
        flexDirection: "row",
        paddingBottom: insets.bottom + 10,
        paddingTop: 15,
        paddingHorizontal: 25,
      }}
    >
      <LinearGradient
        colors={[`rgba(${r},${g},${b},0)`, `rgba(${r},${g},${b},1)`]}
        locations={[0, 1]}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -30,
          left: 0,
          right: 0,
          height: 30,
        }}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        hitSlop={20}
      >
        <ChevronIcon direction="left" size={40} color={corporate} />
      </Pressable>

      {link ? (
        <View
          style={{
            flexDirection: "row",
            ...styles.noBackground,
            ...styles.centered,
            padding: 0,
            borderBottomLeftRadius: 20,
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => onShare(link, { location: "ArticleTop" })}
            hitSlop={20}
            style={({ pressed }) => {
              return {
                flexDirection: "row",
                justifyContent: "flex-start",
                backgroundColor: pressed ? "rgba(120,120,120,0.6)" : undefined,
              };
            }}
          >
            <ShareCounter
              color={corporate}
              shareable={[{ title: "title", url: link }]}
              size={24}
              style={{ color: corporate, fontSize: 16 }}
            />
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            ...styles.noBackground,
            padding: 0,
            borderBottomLeftRadius: 20,
          }}
        />
      )}

      {contentFavIdentifier ? (
        <FavCounter
          shareable={shareable}
          contentFavIdentifier={contentFavIdentifier}
          contentType={contentType}
          style={{
            color: corporate,
            fontSize: 16,
          }}
        />
      ) : (
        <View
          style={{
            ...styles.noBackground,
            width: 40,
          }}
        />
      )}
    </View>
  );
};

export default NavBar;
