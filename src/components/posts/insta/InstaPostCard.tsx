import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TouchableOpacity } from "react-native";

import View from "#/components/design/View";
import InstaPostImage from "#/components/posts/insta/InstaPostImage";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { Achievements } from "#/helpers/Achievements";
import { onShare } from "#/helpers/Sharing";
import ContentStore from "#/helpers/Stores/ContentStore";
import { registerViews } from "#/helpers/network/Engagement";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import type { InstaPostProperties } from "#/types";

const InstaPostCard = (properties: InstaPostProperties) => {
  const { id, permalink, media_url, caption, children, inView } = properties;
  const [registered, setRegistered] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
    setLoaded(true);
  }, [id, properties]);

  useEffect(() => {
    if (inView && loaded && !registered) {
      registerViews(computedPermalink);
      setRegistered(true);
    }
  }, [inView, loaded, registered, computedPermalink]);

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
      />
      <TouchableOpacity
        accessibilityRole="button"
        onPress={handlePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={1}
        style={{ paddingHorizontal: 30, paddingVertical: 10 }}
      >
        <UiText style={{ fontSize: 16 }}>{excerpt}…</UiText>
        <View style={styles.row}>
          <UiText style={{ fontSize: 16, color: corporate }}>mehr</UiText>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(InstaPostCard);
