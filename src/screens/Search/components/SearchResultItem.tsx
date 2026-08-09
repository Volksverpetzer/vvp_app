import { decode } from "html-entities";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View, useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

import Typography from "#/components/ui/Typography";
import UiCard from "#/components/ui/UiCard";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { CONTENT_LINE_HEIGHT } from "#/constants/FontSizes";
import {
  CARD_PADDING,
  CONTENT_HORIZONTAL_PADDING,
  CONTENT_MAX_WIDTH,
  SOURCE_SANS_FONTS,
} from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { getTagStyles } from "#/helpers/utils/color";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

// Konstanten außerhalb der Komponente sind immer stabil
const IGNORED_DOM_TAGS = ["img", "script", "iframe", "style"];

// How many lines of excerpt to show before offering "Mehr lesen" when
// `collapsible` is set.
const COLLAPSED_LINES = 4;

interface SearchResultItemProps {
  title: string;
  text: string;
  subtitle?: ReactNode;
  onPress?: () => void;
  /** Clamp `text` to a few lines with a "Mehr lesen" toggle to expand. */
  collapsible?: boolean;
}

const SearchResultItem = ({
  title,
  text,
  subtitle,
  onPress,
  collapsible = false,
}: SearchResultItemProps) => {
  const colorScheme = useAppColorScheme();
  const textColor = Colors[colorScheme].text;
  const corporate = Colors[colorScheme].primary;
  const styles = useMemo(() => getTagStyles(colorScheme), [colorScheme]);
  const { width, fontScale } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [hasMeasured, setHasMeasured] = useState(false);

  // The excerpt's <p> tag carries its own vertical padding (see
  // getTagStyles), which counts toward both the clamped box and the
  // measured height — fold it in so the line-count math stays accurate.
  const collapsedHeight = useMemo(() => {
    const pPadding = (styles.p as { padding?: number } | undefined)?.padding;
    return COLLAPSED_LINES * CONTENT_LINE_HEIGHT + 2 * (pPadding ?? 0);
  }, [styles]);

  const handleMeasure = useCallback(
    (event: LayoutChangeEvent) => {
      setIsTruncated(event.nativeEvent.layout.height > collapsedHeight);
      setHasMeasured(true);
    },
    [collapsedHeight],
  );

  // The card sits inside globalStyles.content (capped at CONTENT_MAX_WIDTH),
  // so the HTML gets the window width minus both horizontal paddings.
  const contentWidth =
    Math.min(width, CONTENT_MAX_WIDTH) -
    2 * (CARD_PADDING + CONTENT_HORIZONTAL_PADDING);

  // A list item can be recycled for different `text` (e.g. a new search),
  // or reflow on rotation/font-scaling — re-measure instead of keeping a
  // stale expanded/truncated state from the previous content.
  useEffect(() => {
    setExpanded(false);
    setIsTruncated(false);
    setHasMeasured(false);
  }, [text, contentWidth, fontScale]);

  const baseStyle = useMemo(
    () => ({
      fontFamily: "SourceSansPro",
      lineHeight: CONTENT_LINE_HEIGHT,
      color: textColor,
    }),
    [textColor],
  );

  const html = (
    <RenderHtml
      source={{ html: text }}
      tagsStyles={styles}
      ignoredDomTags={IGNORED_DOM_TAGS}
      systemFonts={SOURCE_SANS_FONTS}
      contentWidth={contentWidth}
      baseStyle={baseStyle}
    />
  );

  const content = (
    <UiCard>
      <View style={{ gap: spacing.md }}>
        {title ? <Typography type="heading">{decode(title)}</Typography> : null}

        {/* Source/date stays outside the clamped area so it's always visible. */}
        {subtitle}

        {collapsible ? (
          <>
            <View
              style={
                expanded
                  ? undefined
                  : { maxHeight: collapsedHeight, overflow: "hidden" }
              }
            >
              {html}
            </View>
            {!expanded && !hasMeasured && (
              // Invisible measurer: lays out the full text off-screen so we
              // only show the toggle when it's actually truncated. Only
              // needed until the first measurement lands. Hidden from
              // screen readers so they don't see the excerpt twice.
              <View
                testID="excerpt-measurer"
                style={{ position: "absolute", opacity: 0, zIndex: -1 }}
                pointerEvents="none"
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
                onLayout={handleMeasure}
              >
                {html}
              </View>
            )}
            {isTruncated && (
              <UiPressable
                testID="excerpt-toggle"
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpanded((value) => !value)}
              >
                <UiText bold style={{ color: corporate }}>
                  {expanded ? "Weniger anzeigen" : "Mehr lesen"}
                </UiText>
              </UiPressable>
            )}
          </>
        ) : (
          html
        )}
      </View>
    </UiCard>
  );

  if (onPress) {
    return (
      <UiPressable accessibilityRole="button" onPress={onPress}>
        {content}
      </UiPressable>
    );
  }

  return <View>{content}</View>;
};

export default SearchResultItem;
