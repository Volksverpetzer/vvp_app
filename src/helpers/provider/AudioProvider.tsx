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
import { registerEvent } from "#/helpers/network/Analytics";
import {
  RESUME_END_MARGIN_SECONDS,
  RESUME_MIN_SECONDS,
  RESUME_SAVE_INTERVAL_SECONDS,
} from "#/helpers/utils/audio";
import { crossedMilestones } from "#/helpers/utils/listenMilestones";

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
  /**
   * Marks an audio URL as a podcast episode, so listening to it reports
   * "Podcast Listened" under `link ?? audioUrl` (see usePodcastEpisode).
   */
  registerPodcastEpisode: (audioUrl: string, link?: string | null) => void;
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
  // Set once the restore (incl. its seek) has settled; saving waits for it.
  const restoreSettled = useRef(false);
  // Bumped per playTrack, so a late restore of a previous track is ignored.
  const loadId = useRef(0);
  const lastSavedTime = useRef(0);
  const wantPlay = useRef(false);
  // Podcast episodes by audio URL → analytics URL. Article audio is never
  // registered, so it reports no "Podcast Listened".
  const podcastLinks = useRef(new Map<string, string>());
  // `${audioUrl}|${milestone}` already reported in this app run.
  const reportedMilestones = useRef(new Set<string>());
  // Position at the previous playing tick, to tell playback from jumps.
  const lastListenTime = useRef<number | null>(null);

  const currentUrl = track?.audioUrl ?? null;

  const playTrack = useCallback(
    (next: AudioTrack) => {
      if (track?.audioUrl === next.audioUrl) {
        player.play();
        return;
      }
      hasRestored.current = false;
      restoreSettled.current = false;
      loadId.current += 1;
      lastSavedTime.current = 0;
      lastListenTime.current = null;
      wantPlay.current = true;
      setTrack(next);
      player.replace({ uri: next.audioUrl });
    },
    [track?.audioUrl, player],
  );

  // Restore the stored position once the new track is loaded, then start it.
  // `status` carries no source id: right after playTrack swaps A → B, the
  // render still sees A's last status (isLoaded, A's duration). So check the
  // player's own native state, which already describes B's item once
  // replace() ran, and use B's duration from it.
  useEffect(() => {
    if (!track || hasRestored.current || !status.isLoaded) return;
    if (!player.isLoaded) return;
    hasRestored.current = true;
    const { duration } = player;
    const id = loadId.current;
    const isStale = () => id !== loadId.current;
    const startIfWanted = () => {
      if (isStale()) return;
      restoreSettled.current = true;
      if (wantPlay.current) {
        wantPlay.current = false;
        player.play();
      }
    };
    if (track.resumeKey) {
      PersonalStore.getAudioPosition(track.resumeKey)
        .then((position) => {
          if (
            !isStale() &&
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
  // Status updates only trigger the check; the values come from the player's
  // own native state. `status` has no source id and may still describe the
  // previous track (even after this track's restore settled), whose position
  // must not land under this track's key. Not before the restore has settled
  // either, or the pre-seek position would overwrite the saved one.
  useEffect(() => {
    if (!track?.resumeKey || !status.isLoaded || !status.playing) return;
    if (!restoreSettled.current) return;
    if (!player.isLoaded || !player.playing) return;
    const { currentTime } = player;
    if (
      Math.abs(currentTime - lastSavedTime.current) >=
      RESUME_SAVE_INTERVAL_SECONDS
    ) {
      lastSavedTime.current = currentTime;
      void PersonalStore.setAudioPosition(track.resumeKey, currentTime);
    }
  }, [
    track?.resumeKey,
    status.isLoaded,
    status.playing,
    status.currentTime,
    player,
  ]);

  // Report listening milestones of podcast episodes ("Podcast Listened", the
  // counterpart of the article FullRead), once per episode and milestone per
  // app run. Only positions reached by playback count: crossedMilestones
  // ignores jumps, and tracking starts after the resume restore has settled.
  // Like the save effect, values come from the player's own native state.
  useEffect(() => {
    const url = track ? podcastLinks.current.get(track.audioUrl) : undefined;
    if (
      !track ||
      !url ||
      !restoreSettled.current ||
      !player.isLoaded ||
      !player.playing
    ) {
      lastListenTime.current = null;
      return;
    }
    const { currentTime, duration } = player;
    const crossed = crossedMilestones(
      lastListenTime.current,
      currentTime,
      duration,
    );
    lastListenTime.current = currentTime;
    for (const milestone of crossed) {
      const key = `${track.audioUrl}|${milestone}`;
      if (reportedMilestones.current.has(key)) continue;
      reportedMilestones.current.add(key);
      void registerEvent(url, "Podcast Listened", { progress: milestone });
    }
  }, [track, status.playing, status.currentTime, player]);

  const registerPodcastEpisode = useCallback(
    (audioUrl: string, link?: string | null) => {
      podcastLinks.current.set(audioUrl, link || audioUrl);
    },
    [],
  );

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
      registerPodcastEpisode,
    }),
    [currentUrl, status, player, playTrack, registerPodcastEpisode],
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

/**
 * Marks the given episode as a podcast for the "Podcast Listened" analytics
 * event, reported under `link ?? audioUrl` like the podcast Post Interaction
 * events. Call it wherever an episode can be played; the registration
 * outlives the screen, as playback does.
 */
export const usePodcastEpisode = (
  audioUrl: string | undefined,
  link?: string | null,
) => {
  const { registerPodcastEpisode } = useAudio();
  useEffect(() => {
    if (audioUrl) registerPodcastEpisode(audioUrl, link);
  }, [registerPodcastEpisode, audioUrl, link]);
};
