import Octicons from "@react-native-vector-icons/octicons/static";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";

import { PauseIcon, UnmuteIcon } from "#/components/Icons";
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
    status.duration > 0 ? status.currentTime / status.duration : 0;
  const remaining = status.duration - status.currentTime;

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
      <UnmuteIcon size={16} color={Colors[colorScheme].textMuted} />
      <Pressable
        onPress={() => (status.playing ? player.pause() : player.play())}
        hitSlop={8}
      >
        {status.playing ? (
          <PauseIcon size={26} color={corporate} />
        ) : (
          <Octicons name="play" size={26} color={corporate} />
        )}
      </Pressable>
      <View
        style={{
          flex: 1,
          height: 4,
          backgroundColor: Colors[colorScheme].muted,
          borderRadius: 2,
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
            width: `${progress * 100}%`,
            height: "100%",
            backgroundColor: corporate,
            borderRadius: 2,
          }}
        />
      </View>
      <UiText
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
