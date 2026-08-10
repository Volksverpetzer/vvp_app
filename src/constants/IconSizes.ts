/**
 * Central icon-size scale for the app.
 *
 * Every icon `size` prop should come from this scale so icons read as one
 * system, the same way `radii`/`fontSizes`/`spacing` unify their own
 * dimensions. Built around real usage: `24` is overwhelmingly the app's most
 * common icon size already, so the scale keeps it fixed and folds nearby
 * one-offs onto their nearest step.
 *
 * Mapping: 14,16 -> xs | 18,20 -> sm | 24,26 -> md | 28,32 -> lg |
 * 48,56,60 -> xl.
 */
export const iconSizes = {
  /** Inline/badge icons: info dots, small counters. */
  xs: 16,
  /** Small UI icons: upload/download, list chevrons. */
  sm: 20,
  /** Default icon size — nav bars, list rows, buttons. */
  md: 24,
  /** Prominent icons: modal close buttons, statistics. */
  lg: 32,
  /** Hero icons: empty states, large play/heart buttons. */
  xl: 56,
} as const;

export type IconSizeToken = keyof typeof iconSizes;
