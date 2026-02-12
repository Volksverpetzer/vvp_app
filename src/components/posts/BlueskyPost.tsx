import { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { onLinkPress } from "#/helpers/Linking";
import ContentStore from "#/helpers/Stores/ContentStore";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import {
  DISPLAY_TEXT_EXCERPT,
  DISPLAY_TEXT_FULL,
  DISPLAY_TEXT_NONE,
  DisplayText,
  HttpsUrl,
} from "#/types";

import { PostText } from "./PostText";

export interface BlueskyPostProperties {
  post: FeedViewPost;
  replies?: FeedViewPost[];
  inView?: boolean;
  displayText?: DisplayText;
}

/**
 * Displays a Bluesky post.
 * @param properties
 * @returns
 */
const BlueskyPost = (properties: BlueskyPostProperties) => {
  const {
    post,
    inView,
    displayText = DISPLAY_TEXT_EXCERPT,
    replies,
  } = properties;
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
  }, [inView, properties]);

  const navigateToPost = () => {
    router.push(`/bsky/${postId}`);
  };

  const textRaw = (record?.text as string) || "";
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

  const createdAt = record.created_at as string;
  const displayName = (author as unknown as { display_name: string })
    .display_name;

  const handle = author.handle;
  const url: HttpsUrl = `https://bsky.app/profile/${handle}/post/${postId}`;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={navigateToPost}
      style={{ flex: 1 }}
      disabled={displayText === DISPLAY_TEXT_FULL || replies?.length === 0}
    >
      <Hyperlink
        linkStyle={{ color: corporate }}
        style={{ flex: 1 }}
        onPress={(url: HttpsUrl) => onLinkPress(url, router, uri)}
      >
        <View
          style={{
            position: "relative",
            flex: 1,
            gap: 20,
            paddingHorizontal: 30,
            paddingTop: 20,
          }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}
            onPress={() => onLinkPress(url, router, wpUrl)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <MaterialCommunityIcons
              name="arrow-top-right"
              size={15}
              color={Colors[colorScheme].tabIconDefault}
            />
          </TouchableOpacity>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              width: "100%",
              gap: 10,
            }}
          >
            <Image
              source={{ uri: author.avatar }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            <Text
              style={{
                ...styles.heading,
              }}
            >
              {displayName}
            </Text>
          </View>

          {displayText !== DISPLAY_TEXT_NONE && (
            <Text style={{ lineHeight: 24, fontSize: 18 }}>
              {displayText === DISPLAY_TEXT_FULL ? fulltext : excerpt}
            </Text>
          )}

          {displayText === DISPLAY_TEXT_EXCERPT && (
            <>
              <View style={styles.row}>
                <Text
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
                </Text>
                {replies?.length > 0 && (
                  <Text style={{ fontSize: 16, color: corporate }}>
                    Thread (1 von {replies.length + 1})
                  </Text>
                )}
              </View>
            </>
          )}

          {displayText === DISPLAY_TEXT_FULL &&
            replies &&
            replies.length > 0 &&
            replies.map((reply: FeedViewPost, index: number) => {
              return <PostText key={index} feedViewPost={reply} uri={uri} />;
            })}
        </View>
      </Hyperlink>
    </TouchableOpacity>
  );
};

export default BlueskyPost;
