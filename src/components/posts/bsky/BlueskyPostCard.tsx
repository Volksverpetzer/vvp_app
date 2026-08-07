import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { useEffect } from "react";
import { View } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import { ExternalLinkIcon } from "#/components/Icons";
import { BlueskyPostHeader } from "#/components/posts/bsky/BlueskyPostHeader";
import Typography from "#/components/ui/Typography";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import {
  POST_PADDING_HORIZONTAL,
  globalStyles,
} from "#/constants/GlobalStyles";
import { onLinkPress } from "#/helpers/Linking";
import ContentStore from "#/helpers/Stores/ContentStore";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import { hasCreatedAt, hasText } from "#/helpers/utils/typePredicates";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { BlueskyPostProperties, HttpsUrl } from "#/types";

const htmlPattern = /<[^>]+>/g;

/**
 * Displays a Bluesky post as a feed card (excerpt + navigation to thread).
 */
const BlueskyPostCard = (properties: BlueskyPostProperties) => {
  const { post, inView, replies } = properties;
  const { record, author, uri } = post.post;
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const grey = Colors[colorScheme].textMuted;
  const postId = uri.split("/app.bsky.feed.post/")[1];

  useEffect(() => {
    ContentStore.setStoredBskyPostById(postId, properties);
  }, [inView, postId, properties]);

  const navigateToPost = () => {
    registerPostInteraction(
      `https://bsky.app/profile/${author.handle}/post/${postId}`,
      "bluesky",
      "open",
    );
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
    <UiPressable
      accessibilityRole="button"
      onPress={navigateToPost}
      style={{ flex: 1 }}
      disabled={!isTruncated && !(replies?.length > 0)}
    >
      <View
        style={{
          position: "relative",
          gap: 20,
          paddingHorizontal: POST_PADDING_HORIZONTAL,
          paddingVertical: 20,
        }}
      >
        <UiPressable
          accessibilityRole="button"
          style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}
          onPress={() => onLinkPress(url, router)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ExternalLinkIcon color={Colors[colorScheme].textMuted} />
        </UiPressable>

        <BlueskyPostHeader author={author} />

        <Hyperlink
          linkStyle={{ color: corporate }}
          onPress={(url: HttpsUrl) => onLinkPress(url, router, uri)}
        >
          <Typography type="body">
            {isTruncated ? `${excerpt}…` : excerpt}
          </Typography>
        </Hyperlink>

        <View style={globalStyles.row}>
          {createdAt && (
            <UiText
              size="base"
              style={{
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
            <UiText size="base" style={{ color: corporate }}>
              Thread (1 von {replies.length + 1})
            </UiText>
          ) : (
            isTruncated && (
              <UiText size="base" style={{ color: corporate }}>
                mehr
              </UiText>
            )
          )}
        </View>
      </View>
    </UiPressable>
  );
};

export default BlueskyPostCard;
