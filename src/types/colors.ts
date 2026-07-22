import type { CSSProperties } from "react";

type styleColors = {
  // Surfaces
  background: CSSProperties["color"];
  surface: CSSProperties["color"];
  surfaceInput: CSSProperties["color"];
  surfaceDisabled: CSSProperties["color"];
  surfaceError: CSSProperties["color"];
  // Content
  text: CSSProperties["color"];
  textMuted: CSSProperties["color"];
  // Content on top of primary-colored surfaces
  onPrimary: CSSProperties["color"];
  // Content on top of surfaceError
  onError: CSSProperties["color"];
  // Brand
  primary: CSSProperties["color"];
  primaryMuted: CSSProperties["color"];
  accent: CSSProperties["color"];
  // Feedback: error color readable as text/border on background and surface
  error: CSSProperties["color"];
};

export type colorSchemeType = {
  light: styleColors;
  dark: styleColors;
};
