import { decode } from "html-entities";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { View } from "react-native";
import RenderHtml from "react-native-render-html";

import Heading from "#/components/typography/Heading";
import UiCard from "#/components/ui/UiCard";
import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { SOURCE_SANS_FONTS } from "#/constants/GlobalStyles";
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
        <Heading style={{ color: textColor, marginBottom: 10 }}>
          {decode(title)}
        </Heading>
      ) : null}

      <RenderHtml
        source={{ html: text }}
        tagsStyles={styles}
        ignoredDomTags={IGNORED_DOM_TAGS}
        systemFonts={SOURCE_SANS_FONTS}
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
