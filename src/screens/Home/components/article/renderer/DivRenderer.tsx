import type { InternalRendererProps, TBlock } from "@native-html/render";
import { useInternalRenderer } from "@native-html/render";
import type { ViewStyle } from "react-native";

import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

// Mimikama's own theme uses these classes for note-style callouts ("Mehr zu
// diesem Thema", "Über dieses Format") and a small kicker pill on their
// short-news format ("KURZMELDUNG · GROSSBRITANNIEN") — all styled purely via
// an inline `style="..."` attribute in the WordPress response, which
// RenderHtml doesn't apply. Give them an equivalent look with the app's own
// tokens instead of falling back to unstyled plain text (kept alive through
// ElementHandlers' div-unwrap via the same "mkk-" class check).
const NOTE_BOX_CLASSES = ["mkk-pillar-link", "mkk-about"];
const PILL_CLASSES = ["mkk-label"];

/**
 * Renders a `<div>`. Defers to the default block rendering for every
 * ordinary div; only known Mimikama note/pill classes get a background box.
 */
const DivRenderer = (properties: InternalRendererProps<TBlock>) => {
  const { rendererProps, Renderer } = useInternalRenderer("div", properties);
  const colorScheme = useAppColorScheme();
  const className = properties.tnode.attributes.class ?? "";

  const isPill = PILL_CLASSES.some((c) => className.includes(c));
  const isNoteBox =
    !isPill && NOTE_BOX_CLASSES.some((c) => className.includes(c));

  if (!isPill && !isNoteBox) {
    return <Renderer {...rendererProps} />;
  }

  // `surface` (not `primary`/`accent`, which are dark brand colors meant for
  // white text) is the app's own established "card/muted box" background —
  // already readable against the default (unstyled) text color in both
  // color schemes, same pairing UiCard and friends use elsewhere.
  const surface = Colors[colorScheme].surface;
  const boxStyle: ViewStyle = isPill
    ? {
        alignSelf: "flex-start",
        backgroundColor: surface,
        borderRadius: radii.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        marginLeft: spacing.md,
        marginBottom: spacing.md,
      }
    : {
        backgroundColor: surface,
        borderRadius: radii.md,
        padding: spacing.lg,
        marginHorizontal: spacing.md,
        marginBottom: spacing.xl,
      };

  return (
    <Renderer
      {...rendererProps}
      style={[rendererProps.style as ViewStyle, boxStyle]}
    />
  );
};

export default DivRenderer;
