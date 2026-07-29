import Octicons from "@react-native-vector-icons/octicons/static";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { PauseIcon, UnmuteIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { fontSizes } from "#/constants/FontSizes";
import {
  useAppColorScheme,
  useCorporateColor,
} from "#/hooks/useAppColorScheme";

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  artworkUrl?: string;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const AudioPlayer = ({ audioUrl, title, artworkUrl }: AudioPlayerProps) => {
  const player = useAudioPlayer(audioUrl, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const corporate = useCorporateColor();
  const colorScheme = useAppColorScheme();
  const barWidth = useRef(0);
  const [wasLoaded, setWasLoaded] = useState(false);
  const stableTime = useRef({ currentTime: 0, duration: 0 });

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  }, []);

  useEffect(() => {
    return () => {
      // useAudioPlayer releases the native player on unmount, and that
      // teardown can run before this cleanup — in which case the player is
      // already gone and this call is redundant. The native call is
      // actually promise-based despite the `void` return type, so wrap it
      // to swallow that race instead of surfacing an unhandled rejection.
      Promise.resolve(player.setActiveForLockScreen(false)).catch(() => {});
    };
  }, [player]);

  useEffect(() => {
    setWasLoaded(false);
    stableTime.current = { currentTime: 0, duration: 0 };
    barWidth.current = 0;
  }, [audioUrl]);

  useEffect(() => {
    if (status.didJustFinish) {
      void player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

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

  if (status.error || (!wasLoaded && !status.isLoaded)) return null;

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
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <UnmuteIcon
        size={16}
        color={Colors[colorScheme].textMuted}
        accessible={false}
        importantForAccessibility="no"
      />
      <UiPressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? "Pause" : "Abspielen"}
        onPress={() => {
          if (status.playing) {
            player.pause();
            return;
          }
          void player.setActiveForLockScreen(true, {
            title: title ?? "Artikel anhören",
            artist: Constants.expoConfig?.name ?? "",
            artworkUrl,
          });
          player.play();
        }}
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
