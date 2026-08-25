import { useEffect, useState } from "react";

export type AudioAvailability = "checking" | "available" | "unavailable";

/**
 * Verifies an article's AI-generated audio file actually exists at the CDN
 * before the player is shown — audio isn't generated for every article, and
 * the URL is otherwise just guessed from the slug. Pass undefined to skip
 * checking (e.g. when the audio CDN isn't configured at all).
 */
export const useAudioAvailability = (
  audioUrl: string | undefined,
): AudioAvailability => {
  const [status, setStatus] = useState<AudioAvailability>(() =>
    audioUrl ? "checking" : "unavailable",
  );

  useEffect(() => {
    if (!audioUrl) {
      setStatus("unavailable");
      return;
    }
    setStatus("checking");
    const controller = new AbortController();

    fetch(audioUrl, { method: "HEAD", signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          setStatus(response.ok ? "available" : "unavailable");
        }
      })
      .catch(() => {
        // Ambiguous (offline, CDN hiccup) rather than a confirmed absence —
        // fail open and let the player itself surface a load error.
        if (!controller.signal.aborted) setStatus("available");
      });

    return () => {
      controller.abort();
    };
  }, [audioUrl]);

  return status;
};
