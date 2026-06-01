import { StyleSheet } from "react-native";

import Colors from "./Colors";

export const SOURCE_SANS_FONTS = [
  "SourceSansPro",
  "SourceSansProItalic",
  "SourceSansProBold",
  "SourceSansProBoldItalic",
];

export const CONTENT_MAX_WIDTH = 700;
export const CONTENT_HORIZONTAL_PADDING = 10;
export const POST_PADDING_HORIZONTAL = 30;

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
    borderRadius: 20,
    minHeight: 40,
    paddingHorizontal: 25,
  },
  noBackground: {
    backgroundColor: "transparent",
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
});
