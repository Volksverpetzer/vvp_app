import Octicons from "@react-native-vector-icons/octicons/static";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { PauseIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { fontSizes } from "#/constants/FontSizes";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import {
  RESUME_END_MARGIN_SECONDS,
  RESUME_MIN_SECONDS,
  RESUME_SAVE_INTERVAL_SECONDS,
  formatTime,
} from "#/helpers/utils/audio";
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
  /** Start playback once the audio is loaded (used by lazily mounted players). */
  autoPlay?: boolean;
  /**
   * Render a spinner while loading and an error message on failure instead of
   * rendering nothing. Used where the player appears on user interaction and
   * silence would look like a dead control.
   */
  showFeedback?: boolean;
  /**
   * Persist and restore the playback position under this key (e.g. the
   * episode's audio URL) via PersonalStore, so long audio survives unmounts,
   * refreshes and app restarts. Off when omitted.
   */
  resumeKey?: string;
  /**
   * Horizontal padding of the player row. Defaults to 20; the podcast card
   * passes the text padding so the row lines up with the episode text.
   */
  horizontalPadding?: number;
}

// `shouldPlayInBackground` is a single, module-wide native flag shared by
// every AudioPlayer instance (not scoped per player) — it must only be on
// while a player is actually playing, and there must only ever be one
// playing at a time so backgrounding the app can still pause the rest of
// the app's audio. This module-level state (shared across all mounted
// AudioPlayer instances, since they all import the same module) tracks
// which player currently "owns" background playback.
let activePlayer: { id: string; pause: () => void } | null = null;

const applyBackgroundPlaybackMode = (enabled: boolean) => {
  // The native side rebuilds AudioMode from defaults on every call rather
  // than merging, so all fields must be passed together every time.
  void setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: "doNotMix",
    shouldPlayInBackground: enabled,
  });
};

const AudioPlayer = ({
  audioUrl,
  title,
  artworkUrl,
  autoPlay = false,
  showFeedback = false,
  resumeKey,
  horizontalPadding = 20,
}: AudioPlayerProps) => {
  const player = useAudioPlayer(audioUrl, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const corporate = useCorporateColor();
  const colorScheme = useAppColorScheme();
  const barWidth = useRef(0);
  const [wasLoaded, setWasLoaded] = useState(false);
  const stableTime = useRef({ currentTime: 0, duration: 0 });
  const playerId = player.id;
  const hasAutoPlayed = useRef(false);
  const hasRestored = useRef(false);
  const lastSavedTime = useRef(0);
  // Autoplay must wait for the position restore, otherwise playback starts at
  // 0:00 for a moment before jumping to the resumed position.
  const [restoreDone, setRestoreDone] = useState(!resumeKey);

  // Single active player across the app: starting one pauses the previously
  // active one, toggles the module-wide background-playback mode, and drives
  // the lock-screen / notification now-playing controls.
  useEffect(() => {
    if (!status.playing) {
      if (activePlayer?.id === playerId) {
        activePlayer = null;
        applyBackgroundPlaybackMode(false);
      }
      return;
    }

    if (activePlayer && activePlayer.id !== playerId) {
      activePlayer.pause();
    }
    activePlayer = { id: playerId, pause: () => player.pause() };
    applyBackgroundPlaybackMode(true);
    void player.setActiveForLockScreen(true, {
      title: title ?? "Artikel anhören",
      artist: Constants.expoConfig?.name ?? "",
      artworkUrl,
    });
  }, [status.playing, player, playerId, title, artworkUrl]);

  // Guards against a player being torn down (e.g. by navigating away) while
  // it's still the active background player — reads only the id captured
  // during render, never touches the (possibly already-released) player
  // object itself.
  useEffect(() => {
    return () => {
      if (activePlayer?.id === playerId) {
        activePlayer = null;
        applyBackgroundPlaybackMode(false);
      }
    };
  }, [playerId]);

  useEffect(() => {
    setWasLoaded(false);
    stableTime.current = { currentTime: 0, duration: 0 };
    barWidth.current = 0;
    hasAutoPlayed.current = false;
    hasRestored.current = false;
    lastSavedTime.current = 0;
    setRestoreDone(!resumeKey);
  }, [audioUrl, resumeKey]);

  // Restore the stored playback position once the audio is loaded.
  useEffect(() => {
    if (!resumeKey || hasRestored.current || !status.isLoaded) return;
    hasRestored.current = true;
    const { duration } = status;
    PersonalStore.getAudioPosition(resumeKey)
      .then((position) => {
        if (
          position > RESUME_MIN_SECONDS &&
          (duration === 0 || position < duration - RESUME_END_MARGIN_SECONDS)
        ) {
          lastSavedTime.current = position;
          return player.seekTo(position);
        }
      })
      .finally(() => setRestoreDone(true));
  }, [resumeKey, status, player]);

  // Persist the position every few seconds of playback so it survives
  // unmounts (list virtualization, refresh) and app restarts.
  useEffect(() => {
    if (!resumeKey || !status.isLoaded || !status.playing) return;
    if (
      Math.abs(status.currentTime - lastSavedTime.current) >=
      RESUME_SAVE_INTERVAL_SECONDS
    ) {
      lastSavedTime.current = status.currentTime;
      void PersonalStore.setAudioPosition(resumeKey, status.currentTime);
    }
  }, [resumeKey, status.isLoaded, status.playing, status.currentTime]);

  // Save the last known position on unmount (or clear it when the audio ended
  // near the end margin, so the next mount starts fresh).
  useEffect(() => {
    if (!resumeKey) return;
    return () => {
      const { currentTime, duration } = stableTime.current;
      if (duration > 0 && currentTime >= duration - RESUME_END_MARGIN_SECONDS) {
        void PersonalStore.clearAudioPosition(resumeKey);
      } else if (currentTime > RESUME_MIN_SECONDS) {
        void PersonalStore.setAudioPosition(resumeKey, currentTime);
      }
    };
  }, [resumeKey]);

  useEffect(() => {
    if (autoPlay && restoreDone && status.isLoaded && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      player.play();
    }
  }, [autoPlay, restoreDone, status.isLoaded, player]);

  useEffect(() => {
    if (status.didJustFinish) {
      void player.seekTo(0);
      if (resumeKey) {
        lastSavedTime.current = 0;
        stableTime.current.currentTime = 0;
        void PersonalStore.clearAudioPosition(resumeKey);
      }
    }
  }, [status.didJustFinish, player, resumeKey]);

  // Latch loaded state and keep a snapshot of the last good position so a
  // transient isLoaded=false during seek doesn't unmount the player or reset
  // the progress bar.
  useEffect(() => {
    if (status.isLoaded && !status.error) {
      setWasLoaded(true);
      stableTime.current = {
        currentTime: status.currentTime,
        duration: status.duration,
      };
    }
  }, [status.isLoaded, status.error, status.currentTime, status.duration]);

  if (status.error || (!wasLoaded && !status.isLoaded)) {
    if (!showFeedback) return null;
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
        {status.error ? (
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

  const { currentTime, duration } =
    status.isLoaded && !status.error ? status : stableTime.current;

  const progress =
    duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const remaining = Math.max(0, duration - currentTime);

  const handleSeek = (x: number) => {
    if (barWidth.current === 0 || duration === 0) return;
    const ratio = Math.max(0, Math.min(1, x / barWidth.current));
    void player.seekTo(ratio * duration);
  };

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
        accessibilityLabel={status.playing ? "Pause" : "Abspielen"}
        onPress={() => void (status.playing ? player.pause() : player.play())}
        hitSlop={10}
      >
        {status.playing ? (
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
            void player.seekTo(Math.min(duration, currentTime + step));
          } else if (e.nativeEvent.actionName === "decrement") {
            void player.seekTo(Math.max(0, currentTime - step));
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
        {formatTime(remaining)}
      </UiText>
    </View>
  );
};

export default AudioPlayer;
