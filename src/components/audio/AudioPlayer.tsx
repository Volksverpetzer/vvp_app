import Octicons from "@react-native-vector-icons/octicons/static";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useEffect, useRef } from "react";
import { View } from "react-native";

import { PauseIcon, UnmuteIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import {
  useAppColorScheme,
  useCorporateColor,
} from "#/hooks/useAppColorScheme";

interface AudioPlayerProps {
  audioUrl: string;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
  const player = useAudioPlayer(audioUrl, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const corporate = useCorporateColor();
  const colorScheme = useAppColorScheme();
  const barWidth = useRef(0);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (status.didJustFinish) {
      void player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

  if (!status.isLoaded || status.error) return null;

  const progress =
    status.duration > 0
      ? Math.min(1, Math.max(0, status.currentTime / status.duration))
      : 0;
  const remaining = Math.max(0, status.duration - status.currentTime);

  const handleSeek = (x: number) => {
    if (barWidth.current === 0 || status.duration === 0) return;
    const ratio = Math.max(0, Math.min(1, x / barWidth.current));
    void player.seekTo(ratio * status.duration);
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
        onPress={() => void (status.playing ? player.pause() : player.play())}
        hitSlop={10}
      >
        {status.playing ? (
          <PauseIcon size={26} color={corporate} />
        ) : (
          <Octicons name="play" size={26} color={corporate} />
        )}
      </UiPressable>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Fortschrittsbalken"
        accessibilityValue={{
          min: 0,
          max: Math.floor(status.duration),
          now: Math.floor(status.currentTime),
          text: `${formatTime(Math.floor(status.currentTime))} von ${formatTime(Math.floor(status.duration))}`,
        }}
        accessibilityActions={[
          { name: "increment", label: "15 Sekunden vorspulen" },
          { name: "decrement", label: "15 Sekunden zurückspulen" },
        ]}
        onAccessibilityAction={(e) => {
          const step = 15;
          if (e.nativeEvent.actionName === "increment") {
            void player.seekTo(
              Math.min(status.duration, status.currentTime + step),
            );
          } else if (e.nativeEvent.actionName === "decrement") {
            void player.seekTo(Math.max(0, status.currentTime - step));
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
            backgroundColor: Colors[colorScheme].muted,
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
          fontSize: 13,
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
