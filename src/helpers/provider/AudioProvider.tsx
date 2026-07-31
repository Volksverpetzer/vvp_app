import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import Constants from "expo-constants";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PersonalStore from "#/helpers/Stores/PersonalStore";
import {
  RESUME_END_MARGIN_SECONDS,
  RESUME_MIN_SECONDS,
  RESUME_SAVE_INTERVAL_SECONDS,
} from "#/helpers/utils/audio";

export interface AudioTrack {
  audioUrl: string;
  /** Shown on the lock-screen / notification now-playing controls. */
  title?: string;
  /** Artwork for the lock-screen / notification now-playing controls. */
  artworkUrl?: string;
  /**
   * Persist and restore the playback position under this key (e.g. the
   * episode's audio URL) via PersonalStore. Off when omitted.
   */
  resumeKey?: string;
}

export interface AudioContextValue {
  /** URL of the track the single global player currently holds, or null. */
  currentUrl: string | null;
  isLoaded: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  error: boolean;
  /** Load a track into the global player and start playback. */
  playTrack: (track: AudioTrack) => void;
  /** Play/pause the current track. */
  toggle: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  isCurrent: (audioUrl: string) => boolean;
}

const AudioContext = createContext<AudioContextValue | null>(null);

// One app-wide native audio mode: only enable background playback while
// something is actually playing (see the AudioProvider effect). Rebuilt from
// defaults on every call, so all fields must be passed together.
const applyBackgroundPlaybackMode = (enabled: boolean) => {
  void setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: "doNotMix",
    shouldPlayInBackground: enabled,
  });
};

/**
 * Owns the single, app-wide audio player. Living above the navigator, the
 * player survives screen changes, so playback continues while the user browses
 * (the per-screen AudioPlayer views just render controls bound to it).
 */
export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const hasRestored = useRef(false);
  const lastSavedTime = useRef(0);
  const wantPlay = useRef(false);

  const currentUrl = track?.audioUrl ?? null;

  const playTrack = useCallback(
    (next: AudioTrack) => {
      if (track?.audioUrl === next.audioUrl) {
        player.play();
        return;
      }
      hasRestored.current = false;
      lastSavedTime.current = 0;
      wantPlay.current = true;
      setTrack(next);
      player.replace({ uri: next.audioUrl });
    },
    [track?.audioUrl, player],
  );

  // Restore the stored position once the new track is loaded, then start it.
  useEffect(() => {
    if (!track || hasRestored.current || !status.isLoaded) return;
    hasRestored.current = true;
    const { duration } = status;
    const startIfWanted = () => {
      if (wantPlay.current) {
        wantPlay.current = false;
        player.play();
      }
    };
    if (track.resumeKey) {
      PersonalStore.getAudioPosition(track.resumeKey)
        .then((position) => {
          if (
            position > RESUME_MIN_SECONDS &&
            (duration === 0 || position < duration - RESUME_END_MARGIN_SECONDS)
          ) {
            lastSavedTime.current = position;
            return player.seekTo(position);
          }
        })
        .finally(startIfWanted);
    } else {
      startIfWanted();
    }
  }, [track, status, player]);

  // Toggle background mode + drive the lock-screen controls with playback.
  useEffect(() => {
    if (status.playing) {
      applyBackgroundPlaybackMode(true);
      player.setActiveForLockScreen(true, {
        title: track?.title ?? "Volksverpetzer",
        artist: Constants.expoConfig?.name ?? "",
        artworkUrl: track?.artworkUrl,
      });
    } else {
      applyBackgroundPlaybackMode(false);
    }
  }, [status.playing, player, track?.title, track?.artworkUrl]);

  // Persist the position every few seconds so it survives an app restart.
  useEffect(() => {
    if (!track?.resumeKey || !status.isLoaded || !status.playing) return;
    if (
      Math.abs(status.currentTime - lastSavedTime.current) >=
      RESUME_SAVE_INTERVAL_SECONDS
    ) {
      lastSavedTime.current = status.currentTime;
      void PersonalStore.setAudioPosition(track.resumeKey, status.currentTime);
    }
  }, [track?.resumeKey, status.isLoaded, status.playing, status.currentTime]);

  // On finish: rewind and clear the stored position so the next play starts fresh.
  useEffect(() => {
    if (!status.didJustFinish) return;
    void player.seekTo(0);
    if (track?.resumeKey) {
      lastSavedTime.current = 0;
      void PersonalStore.clearAudioPosition(track.resumeKey);
    }
  }, [status.didJustFinish, player, track?.resumeKey]);

  const value = useMemo<AudioContextValue>(
    () => ({
      currentUrl,
      isLoaded: status.isLoaded && !status.error,
      playing: status.playing,
      currentTime: status.isLoaded ? status.currentTime : 0,
      duration: status.isLoaded ? status.duration : 0,
      error: !!status.error,
      playTrack,
      toggle: () => void (status.playing ? player.pause() : player.play()),
      pause: () => void player.pause(),
      seekTo: (seconds: number) => void player.seekTo(seconds),
      isCurrent: (audioUrl: string) => currentUrl === audioUrl,
    }),
    [currentUrl, status, player, playTrack],
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
};

/** Access the app-wide audio player. Must be used within an AudioProvider. */
export const useAudio = (): AudioContextValue => {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return ctx;
};
