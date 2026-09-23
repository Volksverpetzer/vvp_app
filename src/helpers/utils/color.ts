import Colors from "#/constants/Colors";
import { fontFamily } from "#/constants/FontFamily";
import { CONTENT_LINE_HEIGHT, fontSizes } from "#/constants/FontSizes";
import { spacing } from "#/constants/Spacing";
import type { AppColorScheme } from "#/hooks/useAppColorScheme";

export const isDarkMode = (mode: AppColorScheme) => mode === "dark";

/**
 * Converts a hex color string into its RGB components.
 * Supports shorthand (#abc) and full (#aabbcc) formats.
 * @param hex - The hex color string (with or without leading '#').
 * @returns A tuple of [r, g, b] values.
 */
export const hexToRgb = (hex: string): [number, number, number] => {
  if (hex.length === 4) {
    hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  const bigint = Number.parseInt(hex.replace("#", ""), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

/**
 * Returns the tag styles for the given color scheme
 * @param colorScheme The color scheme to use
 * @returns The tag styles
 */
export const getTagStyles = (colorScheme: AppColorScheme) => {
  const corporate = Colors[colorScheme].primary;
  const textColor = Colors[colorScheme].text;

  return {
    a: {
      color: corporate,
      textDecorationLine: "underline" as const,
      textDecorationColor: corporate,
    },
    em: {
      fontFamily: fontFamily.italic,
    },
    p: {
      color: textColor,
      padding: spacing.md,
      fontSize: fontSizes.lg,
      lineHeight: CONTENT_LINE_HEIGHT,
      marginBottom: spacing.xl,
    },
    strong: {
      color: textColor,
      fontFamily: fontFamily.bold,
      fontWeight: "bold" as const,
    },
    h1: {
      textTransform: "uppercase" as const,
      color: textColor,
      padding: spacing.md,
      fontSize: fontSizes.xxxl,
      fontWeight: "bold" as const,
      marginBottom: spacing.xl,
    },
    h2: {
      textTransform: "uppercase" as const,
      color: textColor,
      padding: spacing.md,
      fontSize: fontSizes.xxl,
      fontWeight: "bold" as const,
      marginBottom: spacing.xl,
    },
    h3: {
      textTransform: "uppercase" as const,
      color: textColor,
      padding: spacing.md,
      fontSize: fontSizes.xxl,
      fontWeight: "bold" as const,
      marginBottom: spacing.xl,
    },
    h4: {
      textTransform: "uppercase" as const,
      color: textColor,
      padding: spacing.md,
      fontSize: fontSizes.xxl,
      fontWeight: "bold" as const,
      marginBottom: spacing.xl,
    },
    h5: {
      color: textColor,
      padding: spacing.md,
      fontSize: fontSizes.xxl,
      fontWeight: "bold" as const,
      marginBottom: spacing.xl,
    },
    li: {
      color: textColor,
      paddingHorizontal: spacing.md,
      fontSize: fontSizes.lg,
      marginBottom: spacing.md,
    },
    ul: {
      marginBottom: spacing.xl,
      paddingLeft: spacing.xxxl,
    },
    img: { minHeight: 200 },
    figure: {
      left: 0,
      marginBottom: spacing.xl,
    },
    div: {},
    iframe: { left: 100 },
    figcaption: {
      color: textColor,
      fontSize: fontSizes.sm,
      padding: spacing.md,
      textAlign: "center" as const,
      fontStyle: "italic" as const,
    },
    blockquote: {
      color: textColor,
      fontSize: fontSizes.lg,
      lineHeight: CONTENT_LINE_HEIGHT,
      fontFamily: fontFamily.italic,
      paddingLeft: spacing.xl,
      paddingRight: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      marginBottom: spacing.xl,
      borderLeftWidth: 4,
      borderLeftColor: corporate,
      backgroundColor: `${corporate}10`, // 10% opacity
    },
    cite: {
      color: textColor,
      fontSize: fontSizes.sm,
      fontFamily: fontFamily.italic,
      textAlign: "right" as const,
      paddingTop: spacing.xs,
    },
  };
};
