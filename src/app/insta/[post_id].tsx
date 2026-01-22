import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { Hyperlink } from "react-native-hyperlink";

import NavBar from "#/components/bars/NavBar";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import InstaPost, { InstaPostProperties } from "#/components/posts/InstaPost";
import Footer from "#/components/views/Footer";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { onLinkPress } from "#/helpers/Linking";
import { registerViews } from "#/helpers/Networking/Analytics";
import API from "#/helpers/Networking/ServerAPI";
import { onShare } from "#/helpers/Sharing";
import ContentStore from "#/helpers/Stores/ContentStore";
import useColorScheme from "#/hooks/useColorScheme";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";

/**
 * InstaScreen renders an Instagram post and its caption,
 * tracks view analytics, and provides share functionality.
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

  // Get dynamic width from feed dimensions
  const { width } = useFeedDimensions();

  // Get URL parameter (post_id) from deep linking / route parameters
  const parameters = useLocalSearchParams<{ post_id: string }>();

  // Retrieve current color scheme to style links appropriately
  const colorScheme = useColorScheme();
  const corporate = Colors[colorScheme].corporate;

  // Get the WordPress URL from configuration and navigation router
  const wpUrl = Config.wpUrl;
  const router = useRouter();

  // Memoize a textStyle object that depends on the dynamic width.
  // This avoids recreating the style object on every render.
  const textStyle = useMemo(
    () => ({
      width,
      marginHorizontal: "auto" as const,
      paddingBottom: 100,
      fontSize: 18,
      textAlign: "left" as const,
      lineHeight: 25,
    }),
    [width],
  );

  // Compute the "transformed" permalink once data is available.
  // This value is reused by the analytics call and hyperlink handler.
  const computedPermalink = useMemo(() => {
    return data?.permalink
      ? data.permalink.replace(
          "https://www.instagram.com/p/",
          `${wpUrl}/insta/`,
        )
      : "";
  }, [data, wpUrl]);

  // Memoize the onPress callback to avoid re-creation on each render.
  const handleLinkPress = useCallback(
    (url: string, _text: string) => {
      onLinkPress(url, router, computedPermalink);
    },
    [router, computedPermalink],
  );

  // Fetch the Instagram post data using a side effect.
  // This effect runs when the post_id (from params) or the wpUrl changes.
  useEffect(() => {
    const fetchPost = async () => {
      let post = await ContentStore.getStoredInstaPost(parameters.post_id);
      if (!post) {
        post = await API.getInstaPost(parameters.post_id);
        await ContentStore.setStoredInstaPost(parameters.post_id, post);
      }
      if (!post) {
        router.back();
        return;
      }
      setData(post);
      setIsLoading(false);

      // Register the view for analytics using the transformed permalink
      registerViews(
        post.permalink.replace(
          "https://www.instagram.com/p/",
          `${wpUrl}/insta/`,
        ),
      );
    };

    fetchPost();
  }, [parameters.post_id, router, wpUrl]);

  // If still loading or data is not available, render a loading state.
  if (isLoading || !data) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Render the post content: the Instagram post,
  // a caption with hyperlinking functionality,
  // a footer for sharing, and a navigation bar.
  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Render the Instagram post; pass all fetched post data */}
        <InstaPost textDisplay={false} disableLink={true} {...data} />

        {/* Wrap caption text in Hyperlink */}
        <Hyperlink linkStyle={{ color: corporate }} onPress={handleLinkPress}>
          <Text style={textStyle}>{data.caption}</Text>
        </Hyperlink>

        {/* Render article footer with sharing functionality */}
        <Footer article_link={data.permalink} onShare={onShare} />
      </ScrollView>

      {/* Render the navigation bar with a link to the post */}
      <NavBar
        link={data.permalink}
        shareable={[{ url: data.permalink, title: data.caption }]}
        contentFavIdentifier={parameters.post_id}
        contentType="insta"
      />
    </View>
  );
};

export default InstaScreen;
