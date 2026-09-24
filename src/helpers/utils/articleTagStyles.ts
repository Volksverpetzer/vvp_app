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
      // Unlike h1/h3/h4/h5 (measured margin 0/0 on the site), the real
      // h2 genuinely has margin-top:24 + margin-bottom:12.8 — it's the
      // one heading that needs its own top space to separate it from
      // the preceding paragraph, so it's exempt from the bottom-only
      // convention here.
      marginTop: spacing.xxl,
      marginBottom: spacing.md,
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
      lineHeight: LINE_HEIGHTS.xl,
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
    ol: {
      // Real <ol> (Gutenberg's "wp-block-list", decimal marker) has no
      // left indent at all on the site — unlike disc <ul>, which needs
      // paddingLeft for the bullet. Still needs paddingLeft.md so the
      // numbers line up with p/h1's own left edge (see ul/p comments on
      // why horizontal padding is app-side, not copied from the site).
      paddingLeft: spacing.md,
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
