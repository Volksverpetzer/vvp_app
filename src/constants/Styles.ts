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
  checkboxBase: {
    backgroundColor: "transparent",
    borderColor: "coral",
    borderRadius: 4,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  checkboxChecked: {
    backgroundColor: "coral",
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
  iconLeft: {
    height: 25,
    position: "absolute",
    width: 20,
  },
  input: {
    borderRadius: 20,
    marginHorizontal: 10,
    marginVertical: 10,
    minHeight: 40,
    paddingLeft: 25,
    paddingRight: 20,
    width: "80%",
  },
  noBackground: {
    backgroundColor: undefined,
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
  whiteText: {
    color: "white",
  },
});
