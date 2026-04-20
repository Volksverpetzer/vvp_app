import type { CSSProperties } from "react";

type styleColors = {
  text: CSSProperties["color"];
  textHeading: CSSProperties["color"];
  background: CSSProperties["color"];
  surface: CSSProperties["color"];
  errorBackground: CSSProperties["color"];
  errorText: CSSProperties["color"];
  iconMuted: CSSProperties["color"];
  muted: CSSProperties["color"];
  textMuted: CSSProperties["color"];
  iconOnPrimary: CSSProperties["color"];
  inputBackground: CSSProperties["color"];
  accent: CSSProperties["color"];
  primary: CSSProperties["color"];
  primaryTint: CSSProperties["color"];
};

export type colorSchemeType = {
  light: styleColors;
  dark: styleColors;
};
