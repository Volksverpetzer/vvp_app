import Colors from "#/constants/Colors";
import { fontFamily } from "#/constants/FontFamily";
import {
  CONTENT_LINE_HEIGHT,
  LINE_HEIGHTS,
  fontSizes,
} from "#/constants/FontSizes";
import { spacing } from "#/constants/Spacing";
import type { AppColorScheme } from "#/hooks/useAppColorScheme";

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
      paddingLeft: spacing.md,
      paddingRight: spacing.md,
      paddingBottom: spacing.xl,
      fontSize: fontSizes.lg,
      lineHeight: CONTENT_LINE_HEIGHT,
    },
    strong: {
      color: textColor,
      fontFamily: fontFamily.bold,
      fontWeight: "bold" as const,
    },
    h1: {
      textTransform: "uppercase" as const,
      color: textColor,
      paddingLeft: spacing.md,
      paddingRight: spacing.md,
      paddingBottom: spacing.md,
      fontSize: fontSizes.xxxl,
      lineHeight: LINE_HEIGHTS.xxxl,
      fontWeight: "bold" as const,
    },
    h2: {
      textTransform: "uppercase" as const,
      color: textColor,
      paddingLeft: spacing.md,
      paddingRight: spacing.md,
      paddingBottom: spacing.md,
      fontSize: fontSizes.xxl,
      lineHeight: LINE_HEIGHTS.xxl,
      fontWeight: "bold" as const,
      marginBottom: spacing.huge,
    },
    h3: {
      textTransform: "uppercase" as const,
      color: textColor,
      paddingLeft: spacing.md,
      paddingRight: spacing.md,
      paddingBottom: spacing.md,
      fontSize: fontSizes.xxl,
      lineHeight: LINE_HEIGHTS.xxl,
      fontWeight: "bold" as const,
    },
    h4: {
      textTransform: "uppercase" as const,
      color: textColor,
      padding: spacing.md,
      fontSize: fontSizes.xxl,
      lineHeight: LINE_HEIGHTS.xxl,
      fontWeight: "bold" as const,
      marginBottom: spacing.xl,
    },
    h5: {
      color: textColor,
      paddingLeft: spacing.md,
      paddingRight: spacing.md,
      paddingBottom: spacing.md,
      fontSize: fontSizes.lg,
      // React Native's lineHeight only accepts a number — there's no "normal"
      // keyword to fall back to, so the equivalent is simply not setting it,
      // leaving the platform to use the font's own natural line height.
      fontWeight: "bold" as const,
    },
    li: {
      color: textColor,
      fontSize: fontSizes.lg,
      lineHeight: CONTENT_LINE_HEIGHT,
      // The site's own <li> has no margin at all — its item spacing
      // comes from an oversized line-height (~2x font-size) on a
      // single line of text, a CSS-only trick RN's box model can't
      // reproduce. marginBottom is the closest RN equivalent to keep
      // list items from running together.
      marginBottom: spacing.md,
    },
    ul: {
      paddingLeft: spacing.xl,
      paddingRight: spacing.md,
      paddingBottom: spacing.xxl,
    },
    img: {
      minHeight: 200,
      // Bare <img> tags (WordPress classic-editor output without a
      // <figure> wrapper) get unwrapped to a plain sibling node by
      // handleImageElements — without their own bottom spacing they'd
      // butt directly against whatever follows (e.g. a heading with
      // no paddingTop under the bottom-only convention).
      marginBottom: spacing.xl,
    },
    figure: {
      left: 0,
      marginBottom: spacing.xl,
    },
    div: {},
    iframe: { left: 100 },
    figcaption: {
      color: textColor,
      fontSize: fontSizes.sm,
      lineHeight: LINE_HEIGHTS.sm,
      paddingLeft: spacing.md,
      paddingRight: spacing.md,
      paddingBottom: spacing.xxl,
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
      lineHeight: LINE_HEIGHTS.sm,
      fontFamily: fontFamily.italic,
      textAlign: "right" as const,
      paddingTop: spacing.xs,
    },
  };
};
