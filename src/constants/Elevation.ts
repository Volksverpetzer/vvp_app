/**
 * Central elevation/shadow scale for the app — sourced from `@volksverpetzer/design-tokens`,
 * the shared token package also consumed by vvp_link_shortener and
 * vvp_divi5_extensions. Edit the scale there (packages/tokens/tokens/elevation.json),
 * not here.
 *
 * Color is always neutral black. A brand-colored shadow (e.g. a pink CTA
 * glow) is a local, one-off design choice, not part of this scale — keep
 * those hand-written at the call site.
 */
export {
  elevation,
  type ElevationToken,
} from "@volksverpetzer/design-tokens/rn/shared";
