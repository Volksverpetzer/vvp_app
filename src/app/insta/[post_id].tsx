import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import NavBar from "#/components/bars/NavBar";
import InstaPostDetail from "#/components/posts/insta/InstaPostDetail";
import UiSpinner from "#/components/ui/UiSpinner";
import Footer from "#/components/views/Footer";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { onShare } from "#/helpers/Sharing";
import ContentStore from "#/helpers/Stores/ContentStore";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import { fetchInstaPostFromAnyAccount } from "#/helpers/utils/instaPost";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { InstaPostProperties } from "#/types";

/**
 * InstaScreen renders an Instagram post and its caption and provides share
 * functionality. Opening it sends a "Post Interaction" open for the post, and
 * useScreenViewTracking counts the screen ("insta"). It sends no pageview:
 * /insta/<id>/ exists only in the app, so it doesn't belong in Top Pages.
 *
 * Optimizations include:
 * - Memoizing computed values (like the replaced permalink)
 * - Memoizing inline style and callback functions to avoid
 *   unnecessary re-creation and re-renders of child components.
 */
const InstaScreen = () => {
  // Local state for the post data and loading flag
  const [data, setData] = useState<InstaPostProperties | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Get URL parameter (post_id) from deep linking / route parameters
  const parameters = useLocalSearchParams<{ post_id: string }>();

  // Get the WordPress URL from configuration and navigation router
  const router = useRouter();
  const wpUrl = Config.wpUrl;
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;

  // Fetch the Instagram post data using a side effect.
  // This effect runs when the post_id (from params) changes.
  useEffect(() => {
    const controller = new AbortController();

    const fetchPost = async () => {
      try {
        let post = await ContentStore.getStoredInstaPost(parameters.post_id);
        if (controller.signal.aborted) return;

        if (!post) {
          post = await fetchInstaPostFromAnyAccount(
            parameters.post_id,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          await ContentStore.setStoredInstaPost(parameters.post_id, post);
          if (controller.signal.aborted) return;
        }
        if (!post) {
          router.back();
          return;
        }
        setData(post);
        setIsLoading(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error loading Instagram post:", error);
        router.back();
      }
    };

    void fetchPost();

    return () => {
      controller.abort();
    };
  }, [parameters.post_id, router]);

  // Counted here rather than on the feed card, so opens via a link from
  // outside the app count too. Same URL as the card's impression. Keyed on
  // the URL so a re-run of the load effect doesn't count the open again.
  const openedUrl = data?.permalink.replace(
    "https://www.instagram.com/p/",
    `${wpUrl}/insta/`,
  );
  useEffect(() => {
    if (openedUrl) registerPostInteraction(openedUrl, "instagram", "open");
  }, [openedUrl]);

  // If still loading or data is not available, render a loading state.
  if (isLoading || !data) {
    return <UiSpinner text="Lade Instagram Beitrag..." />;
  }

  // Render the post content: the Instagram post,
  // a footer for sharing, and a navigation bar.
  return (
    <View style={[globalStyles.container, { backgroundColor }]}>
      <ScrollView>
        {/* Render the Instagram post; pass all fetched post data */}
        <InstaPostDetail {...data} />

        {/* Render article footer with sharing functionality */}
        <Footer article_link={data.permalink} onShare={onShare} />
      </ScrollView>

      {/* Render the navigation bar with a link to the post */}
      <NavBar
        link={data.permalink}
        shareable={[{ url: data.permalink, title: data.caption }]}
        contentFavIdentifier={parameters.post_id}
        contentType="insta"
        favPayload={data}
      />
    </View>
  );
};

export default InstaScreen;
