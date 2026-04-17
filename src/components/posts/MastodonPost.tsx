import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { TouchableOpacity } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import Space from "#/components/design/Space";
import View from "#/components/design/View";
import Heading from "#/components/typography/Heading";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { onLinkPress } from "#/helpers/Linking";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import {
  DISPLAY_TEXT_EXCERPT,
  DISPLAY_TEXT_FULL,
  DISPLAY_TEXT_NONE,
  type HttpsUrl,
  type MastodonPostProperties,
} from "#/types";

type MastodonPostScreenProperties = MastodonPostProperties & {
  inView?: boolean;
};

/**
 * Renders a Mastodon Post
 */
const MastodonPost = (properties: MastodonPostScreenProperties) => {
  const { displayText = DISPLAY_TEXT_EXCERPT, ...post } = properties;
  const { account, content, answers, created_at, uri } = post;
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const grey = Colors[colorScheme].textMuted;
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
      disabled={displayText === DISPLAY_TEXT_FULL}
    >
      <Hyperlink
        linkStyle={{ color: corporate }}
        style={{ flex: 1 }}
        onPress={(url: HttpsUrl) => {
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
              <Heading>&nbsp;{account.display_name}&nbsp;</Heading>
              <UiText style={{ fontSize: 14, color: grey }}>
                &nbsp;@{account.acct}&nbsp;
              </UiText>
            </View>
          </View>
          <Space size={20} />
          {displayText !== DISPLAY_TEXT_NONE && (
            <UiText style={{ lineHeight: 24, fontSize: 18 }}>
              {displayText === DISPLAY_TEXT_FULL ? fulltext : excerpt}
            </UiText>
          )}
          {displayText === DISPLAY_TEXT_EXCERPT &&
            excerpt.length < fulltext.length && (
              <UiText
                style={{
                  lineHeight: 24,
                  fontSize: 18,
                  color: corporate,
                  marginBottom: 20,
                }}
              >
                Mehr Lesen
              </UiText>
            )}
          {displayText !== DISPLAY_TEXT_FULL && (
            <View style={styles.row}>
              <UiText style={{ lineHeight: 24, fontSize: 18, color: grey }}>
                {new Date(created_at).toLocaleTimeString("de-DE", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </UiText>
              {answers && answers.length > 0 && (
                <UiText
                  style={{ lineHeight: 24, fontSize: 18, color: corporate }}
                >
                  Thread 1 von {answers.length + 1}
                </UiText>
              )}
            </View>
          )}
          {displayText === DISPLAY_TEXT_FULL &&
            answers &&
            answers.length > 0 && <Space size={10} />}
          {displayText === DISPLAY_TEXT_FULL &&
            answers &&
            answers.length > 0 &&
            answers.map((answer, index) => {
              const fullText = decode(
                answer.content
                  .replaceAll("</p>", "\n")
                  .replaceAll(htmlPattern, ""),
              );
              return (
                <UiText
                  key={String(index)}
                  style={{ lineHeight: 24, fontSize: 18 }}
                >
                  {fullText}
                </UiText>
              );
            })}
        </View>
      </Hyperlink>
    </TouchableOpacity>
  );
};

export default MastodonPost;
