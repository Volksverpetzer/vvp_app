/**
 * Central font-size scale for the app.
 *
 * Every text size should come from this scale so the typographic hierarchy
 * stays consistent and auditable. Pass a token to `UiText`'s `size` prop
 * (`<UiText size="lg">`); reach for the raw values only where `UiText` isn't
 * involved (e.g. RenderHTML tag styles, plain StyleSheets).
 *
 * The scale deliberately has a small number of steps. Historic one-off sizes
 * (13, 15, 22, 25) were collapsed onto the nearest step — a ±1px shift is a fair
 * trade for one fewer size to reason about.
 */
export const fontSizes = {
  /** Fine print: metadata, timestamps, tiny map labels. */
  xs: 12,
  /** Captions, secondary/greyed labels, figure captions. */
  sm: 14,
  /** Default body text. The baseline of the hierarchy. */
  base: 16,
  /** Emphasised body: social-post fulltext, inputs, headings. */
  lg: 18,
  /** Section titles. */
  xl: 20,
  /** Screen titles, article sub-headings (h2–h5). */
  xxl: 24,
  /** Article headline. */
  headline: 26,
} as const;

export type FontSizeToken = keyof typeof fontSizes;
