/**
 * Central corner-radius scale for the app.
 *
 * Every rounded *corner* should come from this scale so surfaces read as one
 * system. The steps are an arithmetic +4 progression — same reasoning as
 * `fontSizes`: predictable, easy to eyeball, no modular-scale fractions.
 * Historic one-off radii (2, 5, 9, 10, 15, 30) were collapsed onto the nearest
 * step.
 *
 * Not for circles and pills: an avatar, a dot, a FAB or a capsule button
 * derives its radius from its own size (half the height, or `full`), not from
 * this scale. Those sites keep their explicit numbers on purpose — bumping a
 * scale step must never flatten a circle into a rounded rectangle.
 */
export const radii = {
  /** Checkboxes, badge corners, small tappable chips. */
  xs: 4,
  /** Small inline surfaces: list buttons, notice boxes. */
  sm: 8,
  /** Default for cards, buttons and images. */
  md: 12,
  /** Larger content cards and centred modals. */
  lg: 16,
  /** Prominent cards, tab bars, bottom-sheet tops. */
  xl: 20,
  /** Hero surfaces: stats panel, map sheet. */
  xxl: 24,
  /** Fully rounded — pills and circles whose size isn't known up front. */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
