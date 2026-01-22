import { RichText } from "@atproto/api";
import { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useRouter } from "expo-router";
import { Hyperlink } from "react-native-hyperlink";

import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import { onLinkPress } from "#/helpers/Linking";
import { normalizeFacets } from "#/helpers/utils/posts";
import useColorScheme from "#/hooks/useColorScheme";

type Props = {
  feedViewPost: FeedViewPost;
  uri?: string;
};

export const PostText = ({ feedViewPost, uri }: Props) => {
  const router = useRouter();
  const record = feedViewPost?.post?.record;
  const facetsForRichText = normalizeFacets(record.facets);

  const colorScheme = useColorScheme();
  const corporate = Colors[colorScheme].corporate;

  /*
  if (!AppBskyFeedPost.isRecord(record)) {
    return <Text />;
  }
  */

  const richText = new RichText({
    text: record.text as string,
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
      onPress={(url) => onLinkPress(url, router, uri)}
    >
      <Text style={{ lineHeight: 24, fontSize: 18 }}>{decodedText}</Text>
    </Hyperlink>
  );
};
