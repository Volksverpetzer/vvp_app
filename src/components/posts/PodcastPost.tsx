import Octicons from "@react-native-vector-icons/octicons/static";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

import AudioPlayer from "#/components/audio/AudioPlayer";
import Typography from "#/components/ui/Typography";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import {
  DEFAULT_IMAGE_ASPECT_RATIO,
  POST_PADDING_HORIZONTAL,
  globalStyles,
} from "#/constants/GlobalStyles";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import { useAudio } from "#/helpers/provider/AudioProvider";
import { RESUME_MIN_SECONDS, formatTime } from "#/helpers/utils/audio";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type { PodcastEpisodeProperties } from "#/types";

import Badge from "./Badge";

/**
 * Renders a podcast episode (Podigee) card: full-width cover on top, then title,
 * date/duration, a short description and a play control. Tapping the body opens
 * the full episode screen; the play button drives the app-wide player
 * (AudioProvider), and once this episode is the active track the card shows live
 * controls instead of the button.
 */
const PodcastPost = (properties: PodcastEpisodeProperties) => {
  const { id, title, description, published_at, link, audio_url, image_url } =
    properties;
  const [resumePosition, setResumePosition] = useState(0);
  const corporate = useCorporateColor();
  const router = useRouter();
  const audio = useAudio();

  // This episode is "active" once it's the track loaded in the global player;
  // then the card shows live controls instead of the play button.
  const isCurrent = audio.isCurrent(audio_url);

  // Tapping the card body opens the full episode screen (like articles/Insta);
  // the play control below stays on the card for quick inline playback.
  const openEpisode = () => {
    registerPostInteraction(link ?? audio_url, "podcast", "open");
    router.push(`/podcast/${encodeURIComponent(id)}`);
  };

  const playEpisode = () => {
    registerPostInteraction(link ?? audio_url, "podcast", "play");
    audio.playTrack({
      audioUrl: audio_url,
      title,
      artworkUrl: image_url ?? undefined,
      resumeKey: audio_url,
    });
  };

  // Show "Fortsetzen bei …" when a stored playback position exists (until this
  // episode becomes the active track and shows live controls).
  useEffect(() => {
    if (isCurrent) return;
    let cancelled = false;
    PersonalStore.getAudioPosition(audio_url).then((position) => {
      if (!cancelled) setResumePosition(position);
    });
    return () => {
      cancelled = true;
    };
  }, [audio_url, isCurrent]);

  const d = published_at ? new Date(published_at) : undefined;
  const date = d ? `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}` : "";
  const duration = properties.duration
    ? `${Math.max(1, Math.round(properties.duration / 60))} Min.`
    : "";
  const dateDurationText = [date, duration].filter(Boolean).join(" | ");

  return (
    <View>
      <UiPressable
        accessibilityRole="button"
        accessibilityLabel={`Podcast Folge öffnen: ${title}`}
        onPress={openEpisode}
      >
        {image_url && (
          <View style={{ position: "relative" }}>
            <Image
              style={{
                width: "100%",
                aspectRatio: 1 / DEFAULT_IMAGE_ASPECT_RATIO,
                backgroundColor: corporate,
              }}
              source={{ uri: image_url }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
            <Badge position="topLeft" color={corporate}>
              <UiText size="sm" style={globalStyles.whiteText}>
                Podcast
              </UiText>
            </Badge>
          </View>
        )}
        <UiSpace size={image_url ? 12 : 20} />
        <View style={{ paddingHorizontal: POST_PADDING_HORIZONTAL }}>
          {!image_url && (
            <UiText size="sm" style={{ color: corporate, textAlign: "left" }}>
              Podcast
            </UiText>
          )}
          <Typography
            type="cardTitle"
            numberOfLines={2}
            style={{ textAlign: "left" }}
          >
            {title}
          </Typography>
          {!!dateDurationText && (
            <Typography type="meta" style={{ textAlign: "left" }}>
              {dateDurationText}
            </Typography>
          )}
        </View>
        {!!description && (
          <>
            <UiSpace size={10} />
            <UiText
              size="base"
              numberOfLines={2}
              style={{
                paddingHorizontal: POST_PADDING_HORIZONTAL,
                textAlign: "left",
              }}
            >
              {description}
            </UiText>
          </>
        )}
      </UiPressable>
      <View style={{ minHeight: 68, justifyContent: "center" }}>
        {isCurrent ? (
          <AudioPlayer
            audioUrl={audio_url}
            showFeedback
            resumeKey={audio_url}
            title={title}
            artworkUrl={image_url ?? undefined}
            horizontalPadding={POST_PADDING_HORIZONTAL}
            durationSeconds={properties.duration ?? undefined}
          />
        ) : (
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel={`Podcast Folge abspielen: ${title}`}
            onPress={playEpisode}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: POST_PADDING_HORIZONTAL,
              paddingVertical: 12,
            }}
          >
            <Octicons name="play" size={26} color={corporate} />
            <UiText size="base" style={{ color: corporate }}>
              {resumePosition > RESUME_MIN_SECONDS
                ? `Fortsetzen bei ${formatTime(resumePosition)}`
                : "Folge abspielen"}
            </UiText>
          </UiPressable>
        )}
      </View>
    </View>
  );
};

export default React.memo(PodcastPost);
