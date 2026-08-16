/**
 * Central font-size scale for the app — sourced from `@volksverpetzer/design-tokens`,
 * the shared token package also consumed by vvp_link_shortener and
 * vvp_divi5_extensions. Edit the scale there (packages/tokens/tokens/font-size.json),
 * not here.
 *
 * Pass a token to `UiText`'s `size` prop (`<UiText size="lg">`); reach for the
 * raw values only where `UiText` isn't involved (e.g. RenderHTML tag styles,
 * plain StyleSheets).
 */
export {
  fontSizes,
  type FontSizeToken,
  CONTENT_LINE_HEIGHT,
  LINE_HEIGHTS,
} from "@volksverpetzer/design-tokens/rn/shared";
