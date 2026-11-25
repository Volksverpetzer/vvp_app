import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import NavBar from "#/components/bars/NavBar";
import BlueskyPostDetail from "#/components/posts/bsky/BlueskyPostDetail";
import UiSpinner from "#/components/ui/UiSpinner";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import ContentStore from "#/helpers/Stores/ContentStore";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { type BlueskyPostProperties, type HttpsUrl } from "#/types";

const postUrl = (post: BlueskyPostProperties): HttpsUrl => {
  const postId = post.post.post.uri.split("/app.bsky.feed.post/")[1];
  const handle = post.post.post.author.handle;
  return `https://bsky.app/profile/${handle}/post/${postId}`;
};

/**
 * Loads a Bluesky post based on the provided post ID.
 * In order to load the post, it needs to be saved in the ContentStore.
 * If the post is not found, the user is redirected to the previous screen.
 * Opening it sends a "Post Interaction" open for the post.
 */
const BskyScreen = () => {
  const [post, setPost] = useState<BlueskyPostProperties | undefined>();
  const parameters = useLocalSearchParams<{ post_id: string }>();
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;
  useEffect(() => {
    ContentStore.getStoredBskyPostById(parameters.post_id).then((post) => {
      if (post) {
        setPost(post);
      } else {
        router.back();
      }
    });
  }, [parameters.post_id, router]);

  // Keyed on the URL so a re-run of the load effect doesn't count it again.
  const openedUrl = post ? postUrl(post) : undefined;
  useEffect(() => {
    if (openedUrl) registerPostInteraction(openedUrl, "bluesky", "open");
  }, [openedUrl]);

  if (!post) {
    return <UiSpinner text="Lade Bluesky Beitrag..." size="large" />;
  }

  return (
    <View style={[globalStyles.container, { backgroundColor }]}>
      <BlueskyPostDetail {...post} />
      <NavBar link={openedUrl} />
    </View>
  );
};

export default BskyScreen;
