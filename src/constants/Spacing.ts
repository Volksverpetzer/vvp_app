/**
 * Central spacing scale for the app.
 *
 * Every margin/padding/gap value should come from this scale so vertical and
 * horizontal rhythm reads as one system. Built like `radii` and `fontSizes`:
 * a handful of named steps, with historic one-off values collapsed onto the
 * nearest step. Unlike those two scales, the steps here aren't a strict
 * arithmetic progression — `10` and `20` are overwhelmingly the app's most
 * common values already, so the scale is built around keeping those two
 * fixed and folding everything else into its nearest neighbour, not the
 * other way around.
 *
 * Mapping: 2,3,4,5 -> xs | 8 -> sm | 10,12,14 -> md | 15,16 -> lg | 20 -> xl |
 * 24,25,26,28 -> xxl | 30 -> xxxl | 40,50 -> huge.
 *
 * Two kinds of numbers are deliberately left out of the scale:
 * - Negative margins used as overlap offsets (a badge over a card, a logo
 *   over a map) — these derive from the specific overlap, not from rhythm.
 * - Large structural one-offs (e.g. `paddingBottom: 100` for scroll/safe-area
 *   clearance) — these size to their surroundings, not to the type scale.
 * Plain `0`, used to cancel default spacing, also stays a literal.
 */
export const spacing = {
  /** Tightest: icon/dot gaps, inline chip spacing. */
  xs: 4,
  /** Small gap between closely related elements. */
  sm: 8,
  /** Default gap/padding — the app's most common spacing unit. */
  md: 10,
  /** Card padding, section spacing. */
  lg: 16,
  /** Major content grouping, screen padding. */
  xl: 20,
  /** Large section spacing. */
  xxl: 24,
  /** Hero/CTA padding. */
  xxxl: 30,
  /** Empty-state illustrations, big vertical rhythm. */
  huge: 40,
} as const;

export type SpacingToken = keyof typeof spacing;
