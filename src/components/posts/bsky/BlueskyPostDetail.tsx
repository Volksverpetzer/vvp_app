import type { AppBskyFeedDefs } from "@atproto/api";
import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { ScrollView } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import { ExternalLinkIcon } from "#/components/Icons";
import { BlueskyPostHeader } from "#/components/posts/bsky/BlueskyPostHeader";
import { PostText } from "#/components/posts/bsky/PostText";
import Typography from "#/components/ui/Typography";
import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { POST_PADDING_HORIZONTAL } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { onLinkPress } from "#/helpers/Linking";
import { hasText } from "#/helpers/utils/typePredicates";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { BlueskyPostProperties, HttpsUrl } from "#/types";

/**
 * Displays a full Bluesky thread (post + replies) for the detail screen.
 */
const BlueskyPostDetail = ({ post, replies }: BlueskyPostProperties) => {
  const { record, author, uri } = post.post;
  const { wpUrl } = Config;
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const postId = uri.split("/app.bsky.feed.post/")[1];
  const htmlPattern = /<[^>]+>/g;

  const textRaw = hasText(record) ? record.text : "";
  const fulltext = decode(
    textRaw.replaceAll("</p>", "\n").replaceAll(htmlPattern, ""),
  );

  const handle = author.handle;
  const url: HttpsUrl = `https://bsky.app/profile/${handle}/post/${postId}`;

  return (
    <ScrollView
      contentContainerStyle={{
        position: "relative",
        gap: spacing.xl,
        paddingHorizontal: POST_PADDING_HORIZONTAL,
        paddingVertical: spacing.xl,
      }}
    >
      <UiPressable
        accessibilityRole="button"
        accessibilityLabel="In Bluesky öffnen"
        accessibilityHint="Öffnet diesen Beitrag in der Bluesky-App oder im Browser"
        style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}
        onPress={() => onLinkPress(url, router, wpUrl)}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <ExternalLinkIcon color={Colors[colorScheme].textMuted} />
      </UiPressable>

      <BlueskyPostHeader author={author} />

      <Hyperlink
        linkStyle={{ color: corporate }}
        style={{ flex: 1 }}
        onPress={(url: HttpsUrl) => onLinkPress(url, router, uri)}
      >
        <Typography type="body">{fulltext}</Typography>
      </Hyperlink>

      {replies &&
        replies.length > 0 &&
        replies.map((reply: AppBskyFeedDefs.FeedViewPost, index: number) => (
          <PostText
            key={reply.post.uri ?? index}
            feedViewPost={reply}
            uri={uri}
          />
        ))}
    </ScrollView>
  );
};

export default BlueskyPostDetail;
