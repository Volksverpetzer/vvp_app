/**
 * Central corner-radius scale for the app — sourced from `@volksverpetzer/design-tokens`,
 * the shared token package also consumed by vvp_link_shortener and
 * vvp_divi5_extensions. Edit the scale there (packages/tokens/tokens/radius.json),
 * not here.
 *
 * Not for circles and pills: an avatar, a dot, a FAB or a capsule button
 * derives its radius from its own size (half the height, or `full`), not from
 * this scale. Those sites keep their explicit numbers on purpose — bumping a
 * scale step must never flatten a circle into a rounded rectangle.
 */
export {
  radii,
  type RadiusToken,
} from "@volksverpetzer/design-tokens/rn/shared";
