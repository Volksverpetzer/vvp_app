import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import View from "#/components/design/View";
import InstaPostImage from "#/components/posts/insta/InstaPostImage";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { Achievements } from "#/helpers/Achievements";
import { onLinkPress } from "#/helpers/Linking";
import { onShare } from "#/helpers/Sharing";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type { HttpsUrl, InstaPostProperties } from "#/types";

const InstaPostDetail = (properties: InstaPostProperties) => {
  const { id, permalink, media_url, caption, children } = properties;

  const router = useRouter();
  const corporate = useCorporateColor();
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

  return (
    <View>
      <InstaPostImage
        photos={photos}
        width={width}
        corporate={corporate}
        inView={true}
        id={id}
        onLongPress={handleLongPress}
      />
      <Hyperlink linkStyle={{ color: corporate }} onPress={handleLinkPress}>
        <UiText
          style={{
            paddingHorizontal: 10,
            paddingBottom: 50,
            fontSize: 18,
            lineHeight: 24,
          }}
        >
          {caption}
        </UiText>
      </Hyperlink>
    </View>
  );
};

export default React.memo(InstaPostDetail);
