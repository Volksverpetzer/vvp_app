import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import InstaPostImage from "#/components/posts/insta/InstaPostImage";
import Typography from "#/components/ui/Typography";
import Config from "#/constants/Config";
import { CARD_CONTENT_GAP } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { Achievements } from "#/helpers/Achievements";
import { onLinkPress } from "#/helpers/Linking";
import { onShare } from "#/helpers/Sharing";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import { useCorporateColor, useLinkColor } from "#/hooks/useAppColorScheme";
import type { HttpsUrl, InstaPostProperties } from "#/types";

const InstaPostDetail = (properties: InstaPostProperties) => {
  const { id, permalink, media_url, caption, children } = properties;
  // URL of the post whose swipe was sent: the screen can switch to another
  // post without remounting, which then has to count again.
  const [swipedUrl, setSwipedUrl] = useState<string>();

  const router = useRouter();
  const corporate = useCorporateColor();
  const linkColor = useLinkColor();
  const { width } = useWindowDimensions();
  const wpUrl = Config.wpUrl;

  const photos = useMemo(
    () => children?.data?.map((p) => p.media_url) ?? [media_url],
    [children, media_url],
  );

  const computedPermalink = useMemo(
    () => permalink.replace("https://www.instagram.com/p/", `${wpUrl}/insta/`),
    [permalink, wpUrl],
  );

  const handleLinkPress = useCallback(
    (url: HttpsUrl) => {
      onLinkPress(url, router, computedPermalink);
    },
    [router, computedPermalink],
  );

  const handleLongPress = useCallback((source: string) => {
    onShare(source, { location: "longPressImage" });
    Achievements.setAchievementValue("instashare", true);
  }, []);

  // Like the feed card: the first swipe to another photo counts once per
  // screen visit and post as "Post Interaction" swipe.
  const handlePageChange = useCallback(() => {
    if (swipedUrl === computedPermalink) return;
    registerPostInteraction(computedPermalink, "instagram", "swipe");
    setSwipedUrl(computedPermalink);
  }, [swipedUrl, computedPermalink]);

  return (
    <View style={{ gap: CARD_CONTENT_GAP }}>
      <InstaPostImage
        photos={photos}
        width={width}
        corporate={corporate}
        inView={true}
        id={id}
        onLongPress={handleLongPress}
        onPageChange={handlePageChange}
      />
      <Hyperlink linkStyle={{ color: linkColor }} onPress={handleLinkPress}>
        <Typography
          type="body"
          style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.huge }}
        >
          {caption}
        </Typography>
      </Hyperlink>
    </View>
  );
};

export default React.memo(InstaPostDetail);
