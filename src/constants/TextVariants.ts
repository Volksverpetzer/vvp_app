import type { FontSizeToken } from "#/constants/FontSizes";

/**
 * Semantic text roles, keyed by the {@link Typography} `type` prop.
 *
 * A variant bundles the three things that make a piece of text "the same kind
 * of text" everywhere: size, weight and color tone. Prefer `<Typography
 * type="title">` over repeating `size` + `fontFamily: "SourceSansProBold"` +
 * `color: textMuted` per screen, so e.g. an article detail header and a podcast
 * detail header can't drift apart again.
 *
 * `size` / `bold` / an explicit `color` in `style` still override the variant
 * for genuine one-offs.
 */
export const textVariants = {
  /** Headline of a detail screen (article, podcast episode …). */
  title: { size: "xxl", bold: true, tone: "default" },
  /** Headline of a feed card. */
  cardTitle: { size: "xl", bold: true, tone: "default" },
  /** Info line under a title: author, date, duration, reading time. */
  meta: { size: "sm", bold: false, tone: "muted" },
} as const satisfies Record<
  string,
  {
    size: FontSizeToken;
    bold: boolean;
    tone: "default" | "muted";
  }
>;

export type TextVariant = keyof typeof textVariants;
