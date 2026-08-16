/**
 * Central spacing scale for the app — sourced from `@volksverpetzer/design-tokens`,
 * the shared token package also consumed by vvp_link_shortener and
 * vvp_divi5_extensions. Edit the scale there (packages/tokens/tokens/spacing.json),
 * not here.
 *
 * Two kinds of numbers are deliberately left out of the scale:
 * - Negative margins used as overlap offsets (a badge over a card, a logo
 *   over a map) — these derive from the specific overlap, not from rhythm.
 * - Large structural one-offs (e.g. `paddingBottom: 100` for scroll/safe-area
 *   clearance) — these size to their surroundings, not to the type scale.
 * Plain `0`, used to cancel default spacing, also stays a literal.
 */
export {
  spacing,
  type SpacingToken,
} from "@volksverpetzer/design-tokens/rn/shared";
