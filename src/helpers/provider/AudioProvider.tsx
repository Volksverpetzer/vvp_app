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

/**
 * What a track is for the listening analytics: a podcast episode reports
 * "Podcast Listened", an article's read-aloud version "Audio Complete" (the
 * name the web article player on audio.volksverpetzer.de uses). `url` is the
 * event URL: the episode's `link ?? audioUrl` or the article link.
 */
export interface TrackAnalytics {
  kind: "podcast" | "article";
  url: string;
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
   * Marks an audio URL as a podcast episode or article audio, so listening to
   * it is reported (see usePodcastEpisode, useArticleAudio).
   */
  registerTrackAnalytics: (audioUrl: string, analytics: TrackAnalytics) => void;
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
  // Analytics info by audio URL; unregistered tracks report nothing.
  const trackAnalytics = useRef(new Map<string, TrackAnalytics>());
  // `${audioUrl}|${milestone}` already reported in this app run.
  const reportedMilestones = useRef(new Set<string>());
  // Position at the previous tick, to tell playback from jumps. Null when
  // unknown; then the next tick only sets it.
  const lastListenTime = useRef<number | null>(null);
  // While an in-app seek runs, ticks may show the old or the new position;
  // none of them may count. Bumped per seek so only the latest one clears it.
  const seekId = useRef(0);
  const isSeeking = useRef(false);

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
      isSeeking.current = false;
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
      // Baseline at the restored position, so a milestone just after it
      // counts from the first playing tick on.
      lastListenTime.current = player.currentTime;
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

  // Report listening milestones of registered tracks, once per track and
  // milestone per app run: "Podcast Listened" for podcast episodes (the
  // counterpart of the article FullRead), "Audio Complete" for article audio.
  // Only positions reached by playback count: crossedMilestones ignores
  // jumps, in-app seeks reset the baseline, and tracking starts after the
  // resume restore has settled. Like the save effect, values come from the
  // player's own native state.
  useEffect(() => {
    const analytics = track
      ? trackAnalytics.current.get(track.audioUrl)
      : undefined;
    if (
      !track ||
      !analytics ||
      !restoreSettled.current ||
      !player.isLoaded ||
      isSeeking.current
    ) {
      return;
    }
    const { currentTime, duration } = player;
    // Paused: keep the position as the baseline for when playback resumes.
    const crossed = player.playing
      ? crossedMilestones(lastListenTime.current, currentTime, duration)
      : [];
    lastListenTime.current = currentTime;
    for (const milestone of crossed) {
      const key = `${track.audioUrl}|${milestone}`;
      if (reportedMilestones.current.has(key)) continue;
      reportedMilestones.current.add(key);
      if (analytics.kind === "podcast") {
        void registerEvent(analytics.url, "Podcast Listened", {
          progress: milestone,
        });
      } else {
        void registerEvent(analytics.url, "Audio Complete");
      }
    }
  }, [track, status.playing, status.currentTime, player]);

  const registerTrackAnalytics = useCallback(
    (audioUrl: string, analytics: TrackAnalytics) => {
      trackAnalytics.current.set(audioUrl, analytics);
    },
    [],
  );

  // In-app seek (progress bar, skip buttons): not listening, so the position
  // after it becomes the new baseline instead of a step to count.
  const seekTo = useCallback(
    (seconds: number) => {
      seekId.current += 1;
      const id = seekId.current;
      isSeeking.current = true;
      lastListenTime.current = null;
      void player.seekTo(seconds).finally(() => {
        if (id !== seekId.current) return;
        isSeeking.current = false;
        lastListenTime.current = player.currentTime;
      });
    },
    [player],
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
      seekTo,
      isCurrent: (audioUrl: string) => currentUrl === audioUrl,
      registerTrackAnalytics,
    }),
    [currentUrl, status, player, playTrack, seekTo, registerTrackAnalytics],
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
  const { registerTrackAnalytics } = useAudio();
  useEffect(() => {
    if (!audioUrl) return;
    registerTrackAnalytics(audioUrl, {
      kind: "podcast",
      url: link || audioUrl,
    });
  }, [registerTrackAnalytics, audioUrl, link]);
};

/**
 * Marks an article's read-aloud audio for the "Audio Complete" analytics
 * event, reported under the article link like FullRead.
 */
export const useArticleAudio = (
  audioUrl: string | undefined,
  articleLink: string,
) => {
  const { registerTrackAnalytics } = useAudio();
  useEffect(() => {
    if (!audioUrl) return;
    registerTrackAnalytics(audioUrl, { kind: "article", url: articleLink });
  }, [registerTrackAnalytics, audioUrl, articleLink]);
};
