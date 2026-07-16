import { decode } from "html-entities";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

import UiCard from "#/components/ui/UiCard";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
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

interface SearchResultItemProps {
  title: string;
  text: string;
  subtitle?: ReactNode;
  onPress?: () => void;
}

const SearchResultItem = ({
  title,
  text,
  subtitle,
  onPress,
}: SearchResultItemProps) => {
  const colorScheme = useAppColorScheme();
  const textColor = Colors[colorScheme].text;
  const styles = useMemo(() => getTagStyles(colorScheme), [colorScheme]);
  const { width } = useWindowDimensions();

  // The card sits inside globalStyles.content (capped at CONTENT_MAX_WIDTH),
  // so the HTML gets the window width minus both horizontal paddings.
  const contentWidth =
    Math.min(width, CONTENT_MAX_WIDTH) -
    2 * (CARD_PADDING + CONTENT_HORIZONTAL_PADDING);

  const baseStyle = useMemo(
    () => ({
      fontFamily: "SourceSansPro",
      lineHeight: 24,
      color: textColor,
    }),
    [textColor],
  );

  const content = (
    <UiCard>
      {title ? (
        <UiText bold size="lg" style={{ color: textColor, marginBottom: 10 }}>
          {decode(title)}
        </UiText>
      ) : null}

      <RenderHtml
        source={{ html: text }}
        tagsStyles={styles}
        ignoredDomTags={IGNORED_DOM_TAGS}
        systemFonts={SOURCE_SANS_FONTS}
        contentWidth={contentWidth}
        baseStyle={baseStyle}
      />

      {subtitle}
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
