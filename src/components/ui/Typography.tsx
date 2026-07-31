import UiText from "#/components/ui/UiText";
import type { TextVariant } from "#/constants/TextVariants";

type TypographyProperties = Omit<
  React.ComponentProps<typeof UiText>,
  "variant"
> & {
  /**
   * Semantic role of this text (see {@link textVariants}). Sets size, weight
   * and color tone at once so the same kind of text — a screen title, a
   * date/duration/author meta line — looks identical wherever it appears.
   */
  type: TextVariant;
};

/**
 * Semantic text component. Prefer this over `UiText` for anything with a role
 * (titles, meta lines): `<Typography type="title">` instead of
 * hand-tuning `size` / `bold` / `color` per screen. `size`, `bold` and an
 * explicit `color` in `style` still override the variant for one-offs.
 */
const Typography = ({ type, ...properties }: TypographyProperties) => (
  <UiText variant={type} {...properties} />
);

export default Typography;
