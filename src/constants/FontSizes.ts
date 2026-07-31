/**
 * Central font-size scale for the app.
 *
 * Every text size should come from this scale so the typographic hierarchy
 * stays consistent and auditable. Pass a token to `UiText`'s `size` prop
 * (`<UiText size="lg">`); reach for the raw values only where `UiText` isn't
 * involved (e.g. RenderHTML tag styles, plain StyleSheets).
 *
 * The steps are an arithmetic +2 progression (xs–xxl == Tailwind's xs–2xl), not
 * a constant-ratio modular scale: fine control in the reading range (14–18) is
 * worth more in a UI than mathematical elegance. Historic one-off sizes
 * (13, 15, 22, 25, 26) were collapsed onto the nearest step.
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
  /** Largest step: screen/article titles and article sub-headings (h2–h5). */
  xxl: 24,
} as const;

export type FontSizeToken = keyof typeof fontSizes;

/**
 * Line height for readable body copy — article body, social-post fulltext.
 * The article body is the reference; keep other long-form content in sync
 * with it via this constant (and the `body` text variant).
 */
export const CONTENT_LINE_HEIGHT = 27;

/**
 * Recommended line heights per font size for optimal text readability.
 * Use these for multi-line text that doesn't fit a semantic `Typography` role
 * (e.g. social-post metadata, changelog notes, announcement text).
 *
 * Formula: size × 1.35–1.4 for comfortable linespacing without looking loose.
 */
export const LINE_HEIGHTS = {
  xs: 16, // 12 × 1.33
  sm: 19, // 14 × 1.36
  base: 22, // 16 × 1.38
  lg: 24, // 18 × 1.33
  xl: 27, // 20 × 1.35
  xxl: 32, // 24 × 1.33
} as const;
