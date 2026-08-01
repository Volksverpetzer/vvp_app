import { type AppBskyFeedDefs, RichText } from "@atproto/api";
import { useRouter } from "expo-router";
import { Hyperlink } from "react-native-hyperlink";

import Typography from "#/components/ui/Typography";
import Colors from "#/constants/Colors";
import { onLinkPress } from "#/helpers/Linking";
import { normalizeFacets } from "#/helpers/utils/posts";
import { hasText } from "#/helpers/utils/typePredicates";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

interface PostTextProps {
  feedViewPost: AppBskyFeedDefs.FeedViewPost;
  uri?: string;
}

export const PostText = ({ feedViewPost, uri }: PostTextProps) => {
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
      <Typography type="body">{decodedText}</Typography>
    </Hyperlink>
  );
};
