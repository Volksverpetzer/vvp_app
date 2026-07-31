// Resume bounds: don't bother restoring positions in the very beginning, and
// treat positions close to the end as finished.
export const RESUME_MIN_SECONDS = 10;
export const RESUME_END_MARGIN_SECONDS = 10;
// Persist at most every few seconds of playback, not on every 250ms tick.
export const RESUME_SAVE_INTERVAL_SECONDS = 5;

/** Formats seconds as m:ss, e.g. 2592 -> "43:12". */
export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};
