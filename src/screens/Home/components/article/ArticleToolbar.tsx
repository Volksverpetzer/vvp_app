import Octicons from "@react-native-vector-icons/octicons/static";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { Platform } from "react-native";

import Config from "#/constants/Config";
import { onShare } from "#/helpers/Sharing";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import { useFavorite } from "#/hooks/useFavorite";
import type { FaveableType, HttpsUrl, ShareableType } from "#/types";

interface ArticleToolbarProperties {
  link?: HttpsUrl;
  shareable?: ShareableType[];
  contentFavIdentifier?: string;
  contentType?: FaveableType;
}

interface ToolbarIcons {
  back?: ImageSourcePropType;
  share?: ImageSourcePropType;
  star?: ImageSourcePropType;
}

const ICON_SIZE = 24;
const IS_IOS = Platform.OS === "ios";
// Octicons glyph used for "share" — matches ShareIcon in #/components/Icons.
const SHARE_GLYPH = IS_IOS ? "share" : "share-android";

/**
 * Bottom action bar for the article screen, rendered as expo-router's native
 * `Stack.Toolbar` (alpha API — iOS Expo SDK 55+, Android SDK 56+).
 *
 * The two platforms use different native bottom toolbars, so the layout
 * intentionally differs:
 * - iOS renders a full-width UIKit toolbar: back on the left, a flexible
 *   spacer, then share / bookmark on the right.
 * - Android renders a Material 3 floating toolbar (a centered, content-hugging
 *   pill) holding only the actions (share / bookmark). Flexible spacers don't
 *   work there, and back is omitted in favour of the system back gesture.
 *
 * Icons are rasterized from our existing Octicons font and passed to
 * `Stack.Toolbar.Icon` as cross-platform `src` image sources, so the same code
 * path works on iOS and Android without bundling extra PNGs or SF Symbols.
 * We use the async `getImageSource` (backed by Expo's ExpoFontUtils on SDK 54+)
 * rather than `getImageSourceSync`, which needs the optional
 * `@react-native-vector-icons/get-image` native module. The glyphs are
 * rasterized in the corporate color and the native toolbar tints them via
 * `tintColor`, so pressed and disabled states adapt natively.
 *
 * Must be rendered inside a page component (not a layout) for the bottom
 * placement to attach to the current screen.
 */
const ArticleToolbar = (properties: ArticleToolbarProperties) => {
  const { contentFavIdentifier, contentType, link, shareable } = properties;
  const router = useRouter();
  const tint = useCorporateColor();
  const { isFav, toggleFavorite } = useFavorite(
    contentFavIdentifier,
    contentType,
    shareable?.[0]?.url ?? link,
  );
  const [icons, setIcons] = useState<ToolbarIcons>({});

  useEffect(() => {
    let cancelled = false;
    const options = { size: ICON_SIZE, color: tint };

    void (async () => {
      try {
        const [back, share, star] = await Promise.all([
          // Back lives in the iOS toolbar only; skip rasterizing it elsewhere.
          IS_IOS ? Octicons.getImageSource("chevron-left", options) : undefined,
          Octicons.getImageSource(SHARE_GLYPH, options),
          Octicons.getImageSource(isFav ? "star-fill" : "star", options),
        ]);
        // Keep the previously rendered icons until the new ones resolve so
        // toggling the favorite state doesn't flash an empty toolbar.
        if (!cancelled) setIcons({ back, share, star });
      } catch (error) {
        console.warn("Failed to render toolbar icons:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tint, isFav]);

  return (
    <Stack.Toolbar placement="bottom">
      {IS_IOS && (
        <Stack.Toolbar.Button
          tintColor={tint}
          accessibilityLabel="Zurück"
          onPress={() => router.back()}
        >
          {icons.back && <Stack.Toolbar.Icon src={icons.back} />}
        </Stack.Toolbar.Button>
      )}
      {IS_IOS && <Stack.Toolbar.Spacer />}
      {link && (
        <Stack.Toolbar.Button
          tintColor={tint}
          accessibilityLabel="Teilen"
          onPress={() => onShare(link, { location: "ArticleToolbar" })}
        >
          {icons.share && <Stack.Toolbar.Icon src={icons.share} />}
        </Stack.Toolbar.Button>
      )}
      {contentFavIdentifier && Config.enableEngagement && (
        <Stack.Toolbar.Button
          tintColor={tint}
          selected={isFav}
          accessibilityLabel={
            isFav ? "Aus Favoriten entfernen" : "Favorisieren"
          }
          onPress={toggleFavorite}
        >
          {icons.star && <Stack.Toolbar.Icon src={icons.star} />}
        </Stack.Toolbar.Button>
      )}
    </Stack.Toolbar>
  );
};

export default ArticleToolbar;
