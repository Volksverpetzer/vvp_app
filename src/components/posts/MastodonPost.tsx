import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { decode } from "html-entities";
import { View } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import Heading from "#/components/typography/Heading";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import {
  POST_PADDING_HORIZONTAL,
  globalStyles,
} from "#/constants/GlobalStyles";
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
    <UiPressable
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
        <View style={{ flex: 1, paddingHorizontal: POST_PADDING_HORIZONTAL }}>
          <UiSpace size={20} />
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
              <UiText size="sm" style={{ color: grey }}>
                &nbsp;@{account.acct}&nbsp;
              </UiText>
            </View>
          </View>
          <UiSpace size={20} />
          {displayText !== DISPLAY_TEXT_NONE && (
            <UiText size="lg" style={{ lineHeight: 24 }}>
              {displayText === DISPLAY_TEXT_FULL ? fulltext : excerpt}
            </UiText>
          )}
          {displayText === DISPLAY_TEXT_EXCERPT &&
            excerpt.length < fulltext.length && (
              <UiText
                size="lg"
                style={{ lineHeight: 24, color: corporate, marginBottom: 20 }}
              >
                Mehr Lesen
              </UiText>
            )}
          {displayText !== DISPLAY_TEXT_FULL && (
            <View style={globalStyles.row}>
              <UiText size="lg" style={{ lineHeight: 24, color: grey }}>
                {new Date(created_at).toLocaleTimeString("de-DE", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </UiText>
              {answers && answers.length > 0 && (
                <UiText size="lg" style={{ lineHeight: 24, color: corporate }}>
                  Thread 1 von {answers.length + 1}
                </UiText>
              )}
            </View>
          )}
          {displayText === DISPLAY_TEXT_FULL &&
            answers &&
            answers.length > 0 && <UiSpace size={10} />}
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
                  size="lg"
                  style={{ lineHeight: 24 }}
                >
                  {fullText}
                </UiText>
              );
            })}
        </View>
      </Hyperlink>
    </UiPressable>
  );
};

export default MastodonPost;
