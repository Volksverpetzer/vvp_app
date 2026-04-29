import { RichText } from "@atproto/api";
import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useRouter } from "expo-router";
import { Hyperlink } from "react-native-hyperlink";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { onLinkPress } from "#/helpers/Linking";
import { normalizeFacets } from "#/helpers/utils/posts";
import { hasText } from "#/helpers/utils/typePredicates";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

type Props = {
  feedViewPost: FeedViewPost;
  uri?: string;
};

export const PostText = ({ feedViewPost, uri }: Props) => {
  const router = useRouter();
  const record = feedViewPost?.post?.record;

  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;

  if (!hasText(record)) {
    return null;
  }

  const facetsForRichText = normalizeFacets(record.facets);
  const richText = new RichText({
    text: record.text,
    facets: facetsForRichText,
  });

  const linkTextToUrlMap: Record<string, string> = {};
  let decodedText = "";
  for (const segment of richText.segments()) {
    if (segment.isLink()) {
      decodedText += segment.link?.uri || segment.text;
      linkTextToUrlMap[segment.link?.uri] = segment.text;
    } else if (segment.isMention()) {
      decodedText +=
        "https://bsky.app/profile/" + segment.mention?.did || segment.text;
      linkTextToUrlMap["https://bsky.app/profile/" + segment.mention?.did] =
        segment.text;
    } else {
      decodedText += segment.text;
    }
  }

  return (
    <Hyperlink
      linkStyle={{ color: corporate }}
      linkText={(url) => linkTextToUrlMap[url]}
      onPress={(url: HttpsUrl) => onLinkPress(url, router, uri)}
    >
      <UiText style={{ lineHeight: 24, fontSize: 18 }}>{decodedText}</UiText>
    </Hyperlink>
  );
};
