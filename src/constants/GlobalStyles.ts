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

export const globalStyles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.light.accent,
    borderRadius: 4,
    height: 8,
    position: "absolute",
    right: 0,
    alignSelf: "center",
    bottom: "80%",
    width: 8,
  },
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
  header: {
    flex: 1,
    flexDirection: "row",
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
