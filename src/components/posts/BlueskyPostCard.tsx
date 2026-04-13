import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import { ExternalLinkIcon } from "#/components/Icons";
import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { onLinkPress } from "#/helpers/Linking";
import ContentStore from "#/helpers/Stores/ContentStore";
import { hasCreatedAt, hasText } from "#/helpers/utils/typePredicates";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { BlueskyPostProperties, HttpsUrl } from "#/types";

import { BlueskyPostHeader } from "./BlueskyPostHeader";

/**
 * Displays a Bluesky post as a feed card (excerpt + navigation to thread).
 */
const BlueskyPostCard = (properties: BlueskyPostProperties) => {
  const { post, inView, replies } = properties;
  const { record, author, uri } = post.post;
  const { wpUrl } = Config;
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const grey = Colors[colorScheme].grayedOutText;
  const postId = uri.split("/app.bsky.feed.post/")[1];
  const htmlPattern = /<[^>]+>/g;

  useEffect(() => {
    ContentStore.setStoredBskyPostById(postId, properties);
  }, [inView, postId, properties]);

  const navigateToPost = () => {
    router.push(`/bsky/${postId}`);
  };

  const textRaw = hasText(record) ? record.text : "";
  const fulltext = decode(
    textRaw.replaceAll("</p>", "\n").replaceAll(htmlPattern, ""),
  );

  const words = fulltext.split(" ");
  let excerpt = "";
  for (const word of words) {
    const candidate = excerpt ? `${excerpt} ${word}` : word;
    if (candidate.length < 300) {
      excerpt = candidate;
    } else {
      break;
    }
  }
  const isTruncated = excerpt.length < fulltext.length;

  const createdAt = hasCreatedAt(record) ? record.created_at : "";
  const handle = author.handle;
  const url: HttpsUrl = `https://bsky.app/profile/${handle}/post/${postId}`;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={navigateToPost}
      style={{ flex: 1 }}
      disabled={!isTruncated && !(replies?.length > 0)}
    >
      <Hyperlink
        linkStyle={{ color: corporate }}
        style={{ flex: 1 }}
        onPress={(url: HttpsUrl) => onLinkPress(url, router, uri)}
      >
        <View
          style={{
            position: "relative",
            gap: 20,
            paddingHorizontal: 30,
            paddingVertical: 20,
          }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}
            onPress={() => onLinkPress(url, router, wpUrl)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <ExternalLinkIcon color={Colors[colorScheme].tabIconDefault} />
          </TouchableOpacity>

          <BlueskyPostHeader author={author} />

          <UiText style={{ lineHeight: 24, fontSize: 18 }}>
            {isTruncated ? `${excerpt}\u2026` : excerpt}
          </UiText>

          <View style={styles.row}>
            {createdAt && (
              <UiText
                style={{
                  fontSize: 16,
                  color: grey,
                  textAlign: "right",
                }}
              >
                {new Date(createdAt).toLocaleTimeString("de-DE", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </UiText>
            )}
            {replies?.length > 0 ? (
              <UiText style={{ fontSize: 16, color: corporate }}>
                Thread (1 von {replies.length + 1})
              </UiText>
            ) : (
              isTruncated && (
                <UiText style={{ fontSize: 16, color: corporate }}>mehr</UiText>
              )
            )}
          </View>
        </View>
      </Hyperlink>
    </TouchableOpacity>
  );
};

export default BlueskyPostCard;
