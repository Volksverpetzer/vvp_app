import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { View } from "react-native";

import InstaPostImage from "#/components/posts/insta/InstaPostImage";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import {
  CARD_CONTENT_GAP,
  POST_PADDING_HORIZONTAL,
  globalStyles,
} from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { Achievements } from "#/helpers/Achievements";
import { onShare } from "#/helpers/Sharing";
import ContentStore from "#/helpers/Stores/ContentStore";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import { useCorporateColor, useLinkColor } from "#/hooks/useAppColorScheme";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import type { InstaPostProperties } from "#/types";

/**
 * Posts whose swipe was already reported in this app run. Kept outside the
 * component because feed cards sit in a virtualized list: a card that
 * scrolls far away unmounts and would otherwise report its swipe again.
 */
const reportedSwipes = new Set<string>();

/** Forgets the reported swipes; for tests. */
export const resetReportedSwipes = () => reportedSwipes.clear();

const InstaPostCard = (properties: InstaPostProperties) => {
  const { id, permalink, media_url, caption, children, inView } = properties;

  const router = useRouter();
  const corporate = useCorporateColor();
  const linkColor = useLinkColor();
  const { width } = useFeedDimensions();
  const wpUrl = Config.wpUrl;

  const photos = useMemo(
    () => children?.data?.map((p) => p.media_url) ?? [media_url],
    [children, media_url],
  );
  const excerpt = useMemo(() => caption?.slice(0, 70) ?? "", [caption]);

  const computedPermalink = useMemo(
    () => permalink.replace("https://www.instagram.com/p/", `${wpUrl}/insta/`),
    [permalink, wpUrl],
  );

  const handlePress = useCallback(() => {
    // The open is counted by the detail screen, also for outside links.
    router.push(`/insta/${id}`);
  }, [id, router]);

  const handleLongPress = useCallback((source: string) => {
    onShare(source, { location: "longPressImage" });
    Achievements.setAchievementValue("instashare", true);
  }, []);

  const handleFirstLoad = useCallback(() => {
    ContentStore.setStoredInstaPost(id, properties);
  }, [id, properties]);

  // Swiping to another photo is a real interaction with the post, unlike
  // merely scrolling past it, so that is what the feed card counts: once per
  // post per app run, as "Post Interaction" swipe.
  const handlePageChange = useCallback(() => {
    if (reportedSwipes.has(id)) return;
    reportedSwipes.add(id);
    registerPostInteraction(computedPermalink, "instagram", "swipe");
  }, [id, computedPermalink]);

  return (
    <View style={{ gap: CARD_CONTENT_GAP }}>
      <InstaPostImage
        photos={photos}
        width={width}
        corporate={corporate}
        inView={inView}
        id={id}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onFirstLoad={handleFirstLoad}
        onPageChange={handlePageChange}
      />
      <UiPressable
        accessibilityRole="button"
        onPress={handlePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{
          paddingHorizontal: POST_PADDING_HORIZONTAL,
          paddingBottom: spacing.md,
          opacity: 1,
        }}
      >
        <UiText size="base">{excerpt}…</UiText>
        <View style={[globalStyles.row, { justifyContent: "flex-end" }]}>
          <UiText size="base" style={{ color: linkColor }}>
            mehr
          </UiText>
        </View>
      </UiPressable>
    </View>
  );
};

export default React.memo(InstaPostCard);
