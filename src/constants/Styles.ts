import { StyleSheet } from "react-native";

import Colors from "./Colors";

export const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors["light"].highlight,
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
  feed: {
    marginHorizontal: "auto",
    maxWidth: 700,
    width: "94%",
  },
  header: {
    flex: 1,
    flexDirection: "row",
  },
  heading: {
    fontFamily: "SourceSansProSemiBold",
    fontSize: 18,
    fontWeight: "bold",
    padding: 10,
  },
  input: {
    borderRadius: 20,
    minHeight: 40,
    paddingHorizontal: 25,
  },
  noBackground: {
    backgroundColor: "transparent",
  },
  roundEdges: {
    borderRadius: 15,
    marginBottom: "7%",
    minHeight: 200,
    overflow: "hidden",
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
