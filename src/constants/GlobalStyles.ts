import { StyleSheet } from "react-native";

export const SOURCE_SANS_FONTS = [
  "SourceSansPro",
  "SourceSansProItalic",
  "SourceSansProBold",
  "SourceSansProBoldItalic",
];

export const CONTENT_MAX_WIDTH = 700;
export const CONTENT_HORIZONTAL_PADDING = 10;
export const POST_PADDING_HORIZONTAL = 30;
export const CARD_PADDING = 20;

// Height/width ratio of WordPress's default featured-image crop (e.g. 1200x615),
// used as the fallback aspect ratio for post thumbnails whose real image
// dimensions aren't known ahead of layout.
export const DEFAULT_IMAGE_ASPECT_RATIO = 0.5125;

// Shared font size for text inputs (search field, contact form). Kept as a
// standalone constant rather than living on `globalStyles.input`, because that
// style is also spread onto container Views (e.g. the search input row), where
// a text-only prop like fontSize doesn't belong.
export const INPUT_FONT_SIZE = 18;

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
    borderRadius: 40,
    minHeight: 40,
    paddingHorizontal: 25,
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
    fontFamily: "SourceSansProBold",
    fontSize: 14,
    lineHeight: 19,
  },
});
