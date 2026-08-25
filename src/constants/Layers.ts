/**
 * Central z-index scale for the app.
 *
 * Unlike `radii`/`fontSizes`/`spacing`/`iconSizes`, most `zIndex` usages in
 * this app aren't really "global app layers" (header vs. modal vs. toast) —
 * they're local stacking bumps, each only needing to sit above one specific
 * sibling within its own component. Before this scale, that pattern was
 * reimplemented with inconsistent magic numbers (4, 10, 30, 99, 100) for the
 * exact same relationship. Two real, distinct tiers exist:
 *
 * - `raised`: a small local lift above an immediate sibling within the same
 *   composited component (a corner badge over a card, a progress bar over
 *   an image, an overlay button over a post). Since z-index only competes
 *   within the same stacking context, unrelated components using `raised`
 *   never actually contend with each other.
 * - `sticky`: screen-level chrome that must stay above scrolling content
 *   beneath it (a persistent header, a fixed bottom bar).
 *
 * Exception: `AnimatedSuccess.tsx`'s internal 998/999/9999 sequence is left
 * as explicit literals. It renders inside a native `Modal`, which is its own
 * isolated stacking context in React Native — those values only order
 * elements against each other, never against anything in this scale.
 */
export const layers = {
  /** Explicitly below normal content (off-screen measurers). */
  hidden: -1,
  /** Local lift above an immediate sibling within the same component. */
  raised: 1,
  /** Screen-level chrome that must stay above scrolling content. */
  sticky: 100,
} as const;

export type LayerToken = keyof typeof layers;
