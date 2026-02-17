import { CSSProperties } from "react";

type styleColors = {
  text: CSSProperties["color"];
  heading: CSSProperties["color"];
  background: CSSProperties["color"];
  secondaryBackground: CSSProperties["color"];
  errorBackground: CSSProperties["color"];
  errorText: CSSProperties["color"];
  tint: CSSProperties["color"];
  tabIconDefault: CSSProperties["color"];
  grayedOut: CSSProperties["color"];
  grayedOutText: CSSProperties["color"];
  tabIconSelected: CSSProperties["color"];
  inputBackground: CSSProperties["color"];
  highlight: CSSProperties["color"];
  corporate: CSSProperties["color"];
  error: CSSProperties["color"];
};

export type colorSchemeType = {
  light: styleColors;
  dark: styleColors;
};
