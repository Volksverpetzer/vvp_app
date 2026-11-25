import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import NavBar from "#/components/bars/NavBar";
import BlueskyPostDetail from "#/components/posts/bsky/BlueskyPostDetail";
import UiSpinner from "#/components/ui/UiSpinner";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import ContentStore from "#/helpers/Stores/ContentStore";
import { getBskyPostUrl } from "#/helpers/utils/bskyPost";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { type BlueskyPostProperties } from "#/types";

/**
 * Loads a Bluesky post based on the provided post ID.
 * In order to load the post, it needs to be saved in the ContentStore.
 * If the post is not found, the user is redirected to the previous screen.
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

  if (!post) {
    return <UiSpinner text="Lade Bluesky Beitrag..." size="large" />;
  }

  const url = getBskyPostUrl(post.post.post.author.handle, post.post.post.uri);

  return (
    <View style={[globalStyles.container, { backgroundColor }]}>
      <BlueskyPostDetail {...post} />
      <NavBar link={url} />
    </View>
  );
};

export default BskyScreen;
