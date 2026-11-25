/**
 * Listening milestones (percent of the episode) reported as "Podcast Listened",
 * the podcast counterpart of the article "FullRead" event. One milestone keeps
 * the custom-event volume low; add values here for a drop-off curve.
 */
export const PODCAST_LISTENED_MILESTONES = [90] as const;

/**
 * Largest position change between two status ticks (250 ms apart) that still
 * counts as playback: covers faster playback rates and a stalled JS thread,
 * but not a seek, the 15 s skip buttons or restoring a saved resume position.
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
  milestones: readonly number[] = PODCAST_LISTENED_MILESTONES,
): number[] => {
  if (previousTime === null || !(duration > 0)) return [];
  const step = currentTime - previousTime;
  if (step <= 0 || step > MAX_PLAYBACK_STEP_SECONDS) return [];
  return milestones.filter((milestone) => {
    const position = (duration * milestone) / 100;
    return previousTime < position && currentTime >= position;
  });
};
