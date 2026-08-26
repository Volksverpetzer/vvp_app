import { StyleSheet } from "react-native";

import { radii } from "#/constants/BorderRadius";
import { fontFamily } from "#/constants/FontFamily";
import { LINE_HEIGHTS, fontSizes } from "#/constants/FontSizes";
import { spacing } from "#/constants/Spacing";

export const SOURCE_SANS_FONTS = Object.values(fontFamily);

export const CONTENT_MAX_WIDTH = 700;
export const CONTENT_HORIZONTAL_PADDING = spacing.md;
export const POST_PADDING_HORIZONTAL = spacing.xxxl;
export const CARD_PADDING = spacing.xl;

// Vertical gap between a feed post's stacked content blocks — image, title,
// meta line (author/date/duration), caption. Shared so every post type spaces
// its content identically (and independent of variable elements like the
// Instagram image-carousel dots).
export const CARD_CONTENT_GAP = spacing.md;

// Height/width ratio of WordPress's default featured-image crop (e.g. 1200x615),
// used as the fallback aspect ratio for post thumbnails whose real image
// dimensions aren't known ahead of layout.
export const DEFAULT_IMAGE_ASPECT_RATIO = 0.5125;

// Shared font size for text inputs (search field, contact form). Kept as a
// standalone constant rather than living on `globalStyles.input`, because that
// style is also spread onto container Views (e.g. the search input row), where
// a text-only prop like fontSize doesn't belong.
export const INPUT_FONT_SIZE = fontSizes.lg;

export const globalStyles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  content: {
    margin: "auto",
    maxWidth: CONTENT_MAX_WIDTH,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    width: "100%",
  },
  input: {
    borderRadius: radii.full,
    minHeight: spacing.huge,
    paddingHorizontal: spacing.xxl,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  centeredAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  whiteText: {
    color: "white",
  },
  /** Bold label for pill/tab selectors (category pills, UiTabIconLabel) */
  pillLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSizes.sm,
    lineHeight: LINE_HEIGHTS.sm,
  },
});
