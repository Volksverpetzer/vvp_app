import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import UiSpinner from "#/components/animations/UiSpinner";
import NavBar from "#/components/bars/NavBar";
import View from "#/components/design/View";
import BlueskyPost, {
  BlueskyPostProperties,
} from "#/components/posts/BlueskyPost";
import { styles } from "#/constants/Styles";
import ContentStore from "#/helpers/Stores/ContentStore";
import { DISPLAY_TEXT_FULL } from "#/types";

/**
 * Loads a Bluesky post based on the provided post ID.
 * In order to load the post, it needs to be saved in the ContentStore.
 * If the post is not found, the user is redirected to the previous screen.
 */
const BskyScreen = () => {
  const [post, setPost] = useState<BlueskyPostProperties | undefined>();
  const parameters = useLocalSearchParams<{ post_id: string }>();
  const router = useRouter();
  useEffect(() => {
    ContentStore.getStoredBskyPostById(parameters.post_id).then((post) => {
      if (post) {
        setPost(post);
      } else {
        router.back();
      }
    });
  }, [parameters.post_id]);

  if (!post) {
    return <UiSpinner />;
  }

  const postId = post.post.post.uri.split("/app.bsky.feed.post/")[1];
  const handle = post.post.post.author.handle;
  const url = `https://bsky.app/profile/${handle}/post/${postId}`;

  return (
    <View style={styles.container}>
      <BlueskyPost displayText={DISPLAY_TEXT_FULL} {...post} />
      <NavBar link={url} />
    </View>
  );
};

export default BskyScreen;
