export const DISPLAY_TEXT_FULL = "full";
export const DISPLAY_TEXT_EXCERPT = "excerpt";
export const DISPLAY_TEXT_NONE = "none";

export type DisplayText =
  | typeof DISPLAY_TEXT_FULL
  | typeof DISPLAY_TEXT_EXCERPT
  | typeof DISPLAY_TEXT_NONE;
