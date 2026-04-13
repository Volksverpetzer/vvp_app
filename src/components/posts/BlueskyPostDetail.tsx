import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { ScrollView, TouchableOpacity } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import { ExternalLinkIcon } from "#/components/Icons";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { onLinkPress } from "#/helpers/Linking";
import { hasText } from "#/helpers/utils/typePredicates";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { BlueskyPostProperties, HttpsUrl } from "#/types";

import { BlueskyPostHeader } from "./BlueskyPostHeader";
import { PostText } from "./PostText";

/**
 * Displays a full Bluesky thread (post + replies) for the detail screen.
 */
const BlueskyPostDetail = ({ post, replies }: BlueskyPostProperties) => {
  const { record, author, uri } = post.post;
  const { wpUrl } = Config;
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const postId = uri.split("/app.bsky.feed.post/")[1];
  const htmlPattern = /<[^>]+>/g;

  const textRaw = hasText(record) ? record.text : "";
  const fulltext = decode(
    textRaw.replaceAll("</p>", "\n").replaceAll(htmlPattern, ""),
  );

  const handle = author.handle;
  const url: HttpsUrl = `https://bsky.app/profile/${handle}/post/${postId}`;

  return (
    <Hyperlink
      linkStyle={{ color: corporate }}
      style={{ flex: 1 }}
      onPress={(url: HttpsUrl) => onLinkPress(url, router, uri)}
    >
      <ScrollView
        contentContainerStyle={{
          position: "relative",
          gap: 20,
          paddingHorizontal: 30,
          paddingVertical: 20,
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="In Bluesky öffnen"
          accessibilityHint="Öffnet diesen Beitrag in der Bluesky-App oder im Browser"
          style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}
          onPress={() => onLinkPress(url, router, wpUrl)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ExternalLinkIcon color={Colors[colorScheme].tabIconDefault} />
        </TouchableOpacity>

        <BlueskyPostHeader author={author} />

        <UiText style={{ lineHeight: 24, fontSize: 18 }}>{fulltext}</UiText>

        {replies &&
          replies.length > 0 &&
          replies.map((reply: FeedViewPost, index: number) => (
            <PostText
              key={reply.post.uri ?? index}
              feedViewPost={reply}
              uri={uri}
            />
          ))}
      </ScrollView>
    </Hyperlink>
  );
};

export default BlueskyPostDetail;
