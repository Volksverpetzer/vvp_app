import Octicons from "@react-native-vector-icons/octicons/static";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

import AudioPlayer from "#/components/audio/AudioPlayer";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { POST_PADDING_HORIZONTAL } from "#/constants/GlobalStyles";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import { RESUME_MIN_SECONDS, formatTime } from "#/helpers/utils/audio";
import {
  useAppColorScheme,
  useCorporateColor,
} from "#/hooks/useAppColorScheme";
import type { PodcastEpisodeProperties } from "#/types";

const COVER_SIZE = 84;

/**
 * Renders a podcast episode (Podigee) with cover, title, date/duration and a
 * lazily mounted audio player. The player is only created after the user taps
 * play so a feed full of episodes doesn't spawn one native player per card.
 */
const PodcastPost = (properties: PodcastEpisodeProperties) => {
  const { title, description, published_at, link, audio_url, image_url } =
    properties;
  const [playerMounted, setPlayerMounted] = useState(false);
  const [resumePosition, setResumePosition] = useState(0);
  const colorScheme = useAppColorScheme();
  const corporate = useCorporateColor();
  const greyText = Colors[colorScheme].textMuted;

  // Show "Fortsetzen bei …" when a stored playback position exists.
  useEffect(() => {
    if (playerMounted) return;
    let cancelled = false;
    PersonalStore.getAudioPosition(audio_url).then((position) => {
      if (!cancelled) setResumePosition(position);
    });
    return () => {
      cancelled = true;
    };
  }, [audio_url, playerMounted]);

  const d = published_at ? new Date(published_at) : undefined;
  const date = d ? `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}` : "";
  const duration = properties.duration
    ? `${Math.max(1, Math.round(properties.duration / 60))} Min.`
    : "";
  const dateDurationText = [date, duration].filter(Boolean).join(" | ");

  return (
    <View style={{ paddingTop: 20 }}>
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: POST_PADDING_HORIZONTAL,
        }}
      >
        {image_url && (
          <Image
            style={{
              width: COVER_SIZE,
              height: COVER_SIZE,
              borderRadius: 8,
              backgroundColor: corporate,
            }}
            source={{ uri: image_url }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        )}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <UiText size="sm" style={{ color: corporate, textAlign: "left" }}>
            Podcast
          </UiText>
          <UiText
            size="lg"
            numberOfLines={3}
            style={{ fontFamily: "SourceSansProBold", textAlign: "left" }}
          >
            {title}
          </UiText>
          {!!dateDurationText && (
            <UiText size="sm" style={{ color: greyText, textAlign: "left" }}>
              {dateDurationText}
            </UiText>
          )}
        </View>
      </View>
      {!!description && (
        <>
          <UiSpace size={10} />
          <UiText
            size="base"
            numberOfLines={3}
            style={{
              paddingHorizontal: POST_PADDING_HORIZONTAL,
              textAlign: "left",
            }}
          >
            {description}
          </UiText>
        </>
      )}
      <View style={{ minHeight: 68, justifyContent: "center" }}>
        {playerMounted ? (
          <AudioPlayer
            audioUrl={audio_url}
            autoPlay
            showFeedback
            resumeKey={audio_url}
            title={title}
            artworkUrl={image_url ?? undefined}
          />
        ) : (
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel={`Podcast Folge abspielen: ${title}`}
            onPress={() => {
              registerPostInteraction(link ?? audio_url, "podcast", "play");
              setPlayerMounted(true);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 20,
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
