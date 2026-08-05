import { decode } from "html-entities";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getTagStyles } from "#/helpers/utils/color";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

// Konstanten außerhalb der Komponente sind immer stabil
const IGNORED_DOM_TAGS = ["img", "script", "iframe", "style"];

// How many lines of excerpt to show before offering "Mehr lesen" when
// `collapsible` is set.
const COLLAPSED_LINES = 4;
const COLLAPSED_HEIGHT = COLLAPSED_LINES * CONTENT_LINE_HEIGHT;

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
  const { width } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  const handleMeasure = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      if (event.nativeEvent.layout.height > COLLAPSED_HEIGHT) {
        setIsTruncated(true);
      }
    },
    [],
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
  }, [text, contentWidth]);

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
      <View style={{ gap: 10 }}>
        {title ? <Typography type="heading">{decode(title)}</Typography> : null}

        {/* Source/date stays outside the clamped area so it's always visible. */}
        {subtitle}

        {collapsible ? (
          <>
            <View
              style={
                expanded
                  ? undefined
                  : { maxHeight: COLLAPSED_HEIGHT, overflow: "hidden" }
              }
            >
              {html}
            </View>
            {!expanded && !isTruncated && (
              // Invisible measurer: lays out the full text off-screen so we
              // only show the toggle when it's actually truncated. Once we
              // know it's truncated there's nothing left to measure.
              <View
                testID="excerpt-measurer"
                style={{ position: "absolute", opacity: 0, zIndex: -1 }}
                pointerEvents="none"
                onLayout={handleMeasure}
              >
                {html}
              </View>
            )}
            {isTruncated && (
              <UiPressable
                testID="excerpt-toggle"
                accessibilityRole="button"
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
