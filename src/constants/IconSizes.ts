/**
 * Central icon-size scale for the app — sourced from `@volksverpetzer/design-tokens`,
 * the shared token package also consumed by vvp_link_shortener and
 * vvp_divi5_extensions. Edit the scale there (packages/tokens/tokens/icon-size.json),
 * not here.
 */
export {
  iconSizes,
  type IconSizeToken,
} from "@volksverpetzer/design-tokens/rn/shared";

/**
 * Minimum touch target per Apple HIG (44pt) / Material (48dp) guidance.
 * Use this to guarantee a pressable's hit area, whether via explicit
 * `minWidth`/`minHeight` (for a small visual element like a corner badge) or
 * to size `hitSlop` relative to an icon's actual `iconSizes.*` value —
 * hitSlop should make up the rest of the distance to this target, not be a
 * hand-picked number disconnected from the icon it pads.
 */
export { MIN_TOUCH_TARGET } from "@volksverpetzer/design-tokens/rn/shared";
