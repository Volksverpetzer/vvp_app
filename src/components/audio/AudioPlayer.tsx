import Octicons from "@react-native-vector-icons/octicons/static";
import { useRef } from "react";
import { View } from "react-native";

import { PauseIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { fontSizes } from "#/constants/FontSizes";
import { useAudio } from "#/helpers/provider/AudioProvider";
import { formatTime } from "#/helpers/utils/audio";
import {
  useAppColorScheme,
  useCorporateColor,
} from "#/hooks/useAppColorScheme";

interface AudioPlayerProps {
  audioUrl: string;
  /** Title shown on the lock-screen / notification now-playing controls. */
  title?: string;
  /** Artwork shown on the lock-screen / notification now-playing controls. */
  artworkUrl?: string;
  /**
   * Persist and restore the playback position under this key (e.g. the
   * episode's audio URL) via PersonalStore. Off when omitted.
   */
  resumeKey?: string;
  /**
   * Render a spinner while the (current) track is loading and an error message
   * on failure, instead of the plain control row.
   */
  showFeedback?: boolean;
  /** Horizontal padding of the player row. Defaults to 20. */
  horizontalPadding?: number;
  /** Known total length in seconds, shown before playback starts (podcast). */
  durationSeconds?: number;
}

/**
 * Controls view for the app-wide audio player (see AudioProvider). When this
 * track is the one currently loaded, the row reflects and drives live playback;
 * otherwise the play button loads and starts it. The native player lives in the
 * provider, so playback continues when this view unmounts (e.g. on navigation).
 */
const AudioPlayer = ({
  audioUrl,
  title,
  artworkUrl,
  resumeKey,
  showFeedback = false,
  horizontalPadding = 20,
  durationSeconds,
}: AudioPlayerProps) => {
  const audio = useAudio();
  const corporate = useCorporateColor();
  const colorScheme = useAppColorScheme();
  const barWidth = useRef(0);

  const isCurrent = audio.isCurrent(audioUrl);
  const playing = isCurrent && audio.playing;
  const loaded = isCurrent && audio.isLoaded;
  const errored = isCurrent && audio.error;

  const currentTime = isCurrent ? audio.currentTime : 0;
  const duration = isCurrent ? audio.duration : (durationSeconds ?? 0);
  const progress =
    duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const remaining = Math.max(0, duration - currentTime);

  const play = () =>
    audio.playTrack({ audioUrl, title, artworkUrl, resumeKey });

  const onToggle = () => (isCurrent ? audio.toggle() : play());

  const handleSeek = (x: number) => {
    if (!isCurrent || barWidth.current === 0 || duration === 0) return;
    const ratio = Math.max(0, Math.min(1, x / barWidth.current));
    audio.seekTo(ratio * duration);
  };

  // Loading / error feedback only applies while this track is the active one.
  if (showFeedback && isCurrent && (errored || !loaded)) {
    return (
      <View
        style={{
          paddingHorizontal: horizontalPadding,
          paddingVertical: 12,
          minHeight: 50,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {errored ? (
          <UiText
            size="sm"
            style={{ color: Colors[colorScheme].error, textAlign: "center" }}
          >
            Audio konnte nicht geladen werden.
          </UiText>
        ) : (
          <UiSpinner size="small" />
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        paddingHorizontal: horizontalPadding,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <UiPressable
        accessibilityRole="button"
        accessibilityLabel={playing ? "Pause" : "Abspielen"}
        onPress={onToggle}
        hitSlop={10}
      >
        {playing ? (
          <PauseIcon
            size={26}
            color={corporate}
            accessible={false}
            importantForAccessibility="no"
          />
        ) : (
          <Octicons
            name="play"
            size={26}
            color={corporate}
            accessible={false}
            importantForAccessibility="no"
          />
        )}
      </UiPressable>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Fortschrittsbalken"
        accessibilityValue={{
          min: 0,
          max: Math.floor(duration),
          now: Math.floor(currentTime),
          text: `${formatTime(Math.floor(currentTime))} von ${formatTime(Math.floor(duration))}`,
        }}
        accessibilityActions={[
          { name: "increment", label: "15 Sekunden vorspulen" },
          { name: "decrement", label: "15 Sekunden zurückspulen" },
        ]}
        onAccessibilityAction={(e) => {
          const step = 15;
          if (e.nativeEvent.actionName === "increment") {
            audio.seekTo(Math.min(duration, currentTime + step));
          } else if (e.nativeEvent.actionName === "decrement") {
            audio.seekTo(Math.max(0, currentTime - step));
          }
        }}
        style={{
          flex: 1,
          height: 44,
          justifyContent: "center",
          backgroundColor: "transparent",
        }}
        onLayout={(e) => {
          barWidth.current = e.nativeEvent.layout.width;
        }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => handleSeek(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleSeek(e.nativeEvent.locationX)}
      >
        <View
          style={{
            height: 4,
            backgroundColor: Colors[colorScheme].surfaceDisabled,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              backgroundColor: corporate,
              borderRadius: 2,
            }}
          />
        </View>
      </View>
      <UiText
        accessible={false}
        importantForAccessibility="no"
        style={{
          fontSize: fontSizes.sm,
          color: Colors[colorScheme].textMuted,
          minWidth: 38,
          textAlign: "right",
        }}
      >
        {duration > 0 ? formatTime(remaining) : ""}
      </UiText>
    </View>
  );
};

export default AudioPlayer;
