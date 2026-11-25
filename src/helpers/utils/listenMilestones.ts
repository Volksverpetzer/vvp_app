/**
 * Listening milestones (percent of the track) reported as "Podcast Listened"
 * (podcasts, the counterpart of the article "FullRead" event) and as "Audio
 * Complete" (article audio). One milestone keeps the custom-event volume low;
 * more values here give podcasts a drop-off curve via the `progress` prop, but
 * would also need "Audio Complete" restricted to the last one.
 */
export const LISTEN_MILESTONES = [90] as const;

/**
 * Largest position change between two status ticks (250 ms apart) that still
 * counts as playback: covers faster playback rates and a stalled JS thread,
 * but not the 15 s skip buttons or restoring a saved resume position. A last
 * line of defence for jumps the app doesn't see (e.g. lock-screen seeks);
 * in-app seeks are excluded by AudioProvider.seekTo.
 */
export const MAX_PLAYBACK_STEP_SECONDS = 3;

/**
 * Milestones that playback itself crossed between two ticks: the position
 * moved forward by at most MAX_PLAYBACK_STEP_SECONDS and passed the
 * milestone's position. Jumps (seeking past a milestone, a resume restore
 * landing beyond it) cross nothing, so only actual listening counts.
 * `previousTime` is null when there is no earlier tick to compare with.
 */
export const crossedMilestones = (
  previousTime: number | null,
  currentTime: number,
  duration: number,
  milestones: readonly number[] = LISTEN_MILESTONES,
): number[] => {
  if (previousTime === null || !(duration > 0)) return [];
  const step = currentTime - previousTime;
  if (step <= 0 || step > MAX_PLAYBACK_STEP_SECONDS) return [];
  return milestones.filter((milestone) => {
    const position = (duration * milestone) / 100;
    return previousTime < position && currentTime >= position;
  });
};
