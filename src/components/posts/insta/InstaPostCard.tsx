import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { TouchableOpacity } from "react-native";

import View from "#/components/design/View";
import InstaPostImage from "#/components/posts/insta/InstaPostImage";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { Achievements } from "#/helpers/Achievements";
import { onShare } from "#/helpers/Sharing";
import ContentStore from "#/helpers/Stores/ContentStore";
import { registerViews } from "#/helpers/network/Engagement";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import type { InstaPostProperties } from "#/types";

type InstaPostCardProperties = InstaPostProperties & { inView?: boolean };

const InstaPostCard = (properties: InstaPostCardProperties) => {
  const { id, permalink, media_url, caption, children, inView } = properties;
  const [registered, setRegistered] = useState(false);

  const router = useRouter();
  const corporate = useCorporateColor();
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
    router.push(`/insta/${id}`);
  }, [id, router]);

  const handleLongPress = useCallback((source: string) => {
    onShare(source, { location: "longPressImage" });
    Achievements.setAchievementValue("instashare", true);
  }, []);

  const handleFirstLoad = useCallback(() => {
    ContentStore.setStoredInstaPost(id, properties);
  }, [id, properties]);

  const handlePageChange = useCallback(() => {
    if (registered) return;
    registerViews(computedPermalink);
    setRegistered(true);
  }, [registered, computedPermalink]);

  return (
    <View>
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
      <TouchableOpacity
        accessibilityRole="button"
        onPress={handlePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={1}
        style={{ paddingHorizontal: 30 }}
      >
        <UiText style={{ fontSize: 16, textAlign: "left" }}>
          {excerpt}
          {"... "}
          <UiText style={{ color: corporate, fontSize: 16 }}>mehr</UiText>
        </UiText>
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(InstaPostCard);
