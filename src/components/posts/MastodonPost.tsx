import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { TouchableOpacity } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { onLinkPress } from "#/helpers/Linking";
import useColorScheme from "#/hooks/useColorScheme";

export interface MastodonPostProperties {
  id: number;
  created_at: string; // ISO 8601 date string
  content: string;
  replies_count: number;
  reblogs_count: number;
  favourites_count: number;
  answers: MastodonPostProperties[] | null;
  in_reply_to_id: number;
  reblog: unknown;
  card: null;
  uri: string;
  account: {
    id: number;
    username: string;
    uri: string;
    acct: string;
    display_name: string;
    followers_count: number;
    following_count: number;
    statuses_count: number;
    avatar: string;
  };
}

type MastodonPostScreenProperties = MastodonPostProperties & {
  inView?: boolean;
  textDisplay?: boolean;
};

/**
 * Renders a Mastodon Post
 */
const MastodonPost = (properties: MastodonPostScreenProperties) => {
  const { textDisplay, ...post } = properties;
  const { account, content, answers, created_at, uri } = post;
  const router = useRouter();
  const colorScheme = useColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const grey = Colors[colorScheme].grayedOutText;
  const htmlPattern = /<[^>]+>/g;
  const fulltext = decode(
    content.replaceAll("</p>", "\n").replaceAll(htmlPattern, ""),
  );
  // excerpt without breaking word with max length of 300
  const words = fulltext.split(" ");
  let excerpt = "";
  for (const word of words) {
    if (excerpt.length + word.length + 1 < 300) {
      excerpt += (excerpt ? " " : "") + word;
    } else {
      break;
    }
  }
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => router.push(`/bsky/${post.id}`)}
      style={{ flex: 1 }}
      disabled={textDisplay}
    >
      <Hyperlink
        linkStyle={{ color: corporate }}
        style={{ flex: 1 }}
        onPress={(url) => {
          onLinkPress(url, router, uri);
        }}
      >
        <View style={{ flex: 1, paddingHorizontal: 30 }}>
          <Space size={20} />
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              width: "100%",
            }}
          >
            <Image
              source={{ uri: account.avatar }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            <View style={{ marginLeft: 10 }}>
              <Text
                style={{
                  ...styles.heading,
                  paddingHorizontal: 0,
                  paddingVertical: 0,
                }}
              >
                &nbsp;{account.display_name}&nbsp;
              </Text>
              <Text style={{ fontSize: 14, color: grey }}>
                &nbsp;@{account.acct}&nbsp;
              </Text>
            </View>
          </View>
          <Space size={20} />
          <Text style={{ lineHeight: 24, fontSize: 18 }}>
            {textDisplay ? fulltext : excerpt}
          </Text>
          {!textDisplay && excerpt.length < fulltext.length && (
            <Text
              style={{
                lineHeight: 24,
                fontSize: 18,
                color: corporate,
                marginBottom: 20,
              }}
            >
              Mehr Lesen
            </Text>
          )}
          {!textDisplay && (
            <View style={styles.row}>
              <Text style={{ lineHeight: 24, fontSize: 18, color: grey }}>
                {new Date(created_at).toLocaleTimeString("de-DE", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </Text>
              {answers && answers.length > 0 && (
                <Text
                  style={{ lineHeight: 24, fontSize: 18, color: corporate }}
                >
                  Thread 1 von {answers.length + 1}
                </Text>
              )}
            </View>
          )}
          {textDisplay && answers && answers.length > 0 && <Space size={10} />}
          {textDisplay &&
            answers &&
            answers.length > 0 &&
            answers.map((answer, index) => {
              const fullText = decode(
                answer.content
                  .replaceAll("</p>", "\n")
                  .replaceAll(htmlPattern, ""),
              );
              return (
                <Text
                  key={String(index)}
                  style={{ lineHeight: 24, fontSize: 18 }}
                >
                  {fullText}
                </Text>
              );
            })}
        </View>
      </Hyperlink>
    </TouchableOpacity>
  );
};

export default MastodonPost;
