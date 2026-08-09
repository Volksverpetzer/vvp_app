import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import AudioPlayer from "#/components/audio/AudioPlayer";
import NavBar from "#/components/bars/NavBar";
import Typography from "#/components/ui/Typography";
import UiSpace from "#/components/ui/UiSpace";
import UiSpinner from "#/components/ui/UiSpinner";
import Footer from "#/components/views/Footer";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import {
  POST_PADDING_HORIZONTAL,
  globalStyles,
} from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { onShare } from "#/helpers/Sharing";
import API from "#/helpers/network/ServerAPI";
import {
  useAppColorScheme,
  useCorporateColor,
} from "#/hooks/useAppColorScheme";
import type { PodcastEpisodeProperties } from "#/types";
import { FAV_TYPE_PODCAST } from "#/types";

// The square cover sits a little narrower than the text column (design), so
// it's inset a bit more than POST_PADDING_HORIZONTAL.
const COVER_PADDING_HORIZONTAL = POST_PADDING_HORIZONTAL + 16;

/**
 * Full podcast episode screen: a square cover, title, date/duration, the full
 * description and the audio player. Reached from the podcast feed card.
 *
 * Podigee has no per-episode endpoint, so the episode is located by id in the
 * (server-cached) podcast feed.
 */
const PodcastScreen = () => {
  const [episode, setEpisode] = useState<
    PodcastEpisodeProperties | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const corporate = useCorporateColor();
  const backgroundColor = Colors[colorScheme].background;

  useEffect(() => {
    const controller = new AbortController();

    const fetchEpisode = async () => {
      try {
        const episodes = await API.getPodcastFeed(controller.signal);
        if (controller.signal.aborted) return;
        const decodedId = decodeURIComponent(id);
        const found = episodes.find((e) => e.id === decodedId);
        if (!found) {
          router.back();
          return;
        }
        setEpisode(found);
        setIsLoading(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error loading podcast episode:", error);
        router.back();
      }
    };

    void fetchEpisode();

    return () => {
      controller.abort();
    };
  }, [id, router]);

  if (isLoading || !episode) {
    return <UiSpinner text="Lade Podcast Folge..." />;
  }

  const d = episode.published_at ? new Date(episode.published_at) : undefined;
  const date = d ? `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}` : "";
  const duration = episode.duration
    ? `${Math.max(1, Math.round(episode.duration / 60))} Min.`
    : "";
  const dateDurationText = [date, duration].filter(Boolean).join(" | ");

  return (
    <View style={[globalStyles.container, { backgroundColor }]}>
      <ScrollView>
        {episode.image_url && (
          <View
            style={{
              paddingTop: spacing.lg,
              paddingHorizontal: COVER_PADDING_HORIZONTAL,
            }}
          >
            <Image
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: radii.md,
                backgroundColor: corporate,
              }}
              source={{ uri: episode.image_url }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          </View>
        )}
        <UiSpace size={16} />
        <View style={{ paddingHorizontal: POST_PADDING_HORIZONTAL }}>
          <Typography type="title">{episode.title}</Typography>
          {!!dateDurationText && (
            <Typography type="meta">{dateDurationText}</Typography>
          )}
        </View>

        <UiSpace size={12} />
        <AudioPlayer
          audioUrl={episode.audio_url}
          showFeedback
          resumeKey={episode.audio_url}
          title={episode.title}
          artworkUrl={episode.image_url ?? undefined}
          horizontalPadding={POST_PADDING_HORIZONTAL}
          durationSeconds={episode.duration ?? undefined}
        />
        <UiSpace size={12} />

        {!!episode.description && (
          <Typography
            type="body"
            style={{ paddingHorizontal: POST_PADDING_HORIZONTAL }}
          >
            {episode.description}
          </Typography>
        )}

        {episode.link && (
          <Footer article_link={episode.link} onShare={onShare} />
        )}
      </ScrollView>

      <NavBar
        link={episode.link ?? undefined}
        shareable={
          episode.link
            ? [{ url: episode.link, title: "Podcast Folge teilen" }]
            : undefined
        }
        contentType={FAV_TYPE_PODCAST}
        contentFavIdentifier={episode.id}
        favPayload={episode}
      />
    </View>
  );
};

export default PodcastScreen;
