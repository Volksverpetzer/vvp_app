import { decode } from "html-entities";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

import Card from "#/components/design/Card";
import Heading from "#/components/typography/Heading";
import Colors from "#/constants/Colors";
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
  const styles = useMemo(() => getTagStyles(colorScheme), [colorScheme]);
  const { width } = useWindowDimensions();

  // Card has padding: 20 on each side (40 total horizontal padding)
  // FlatList has paddingHorizontal: 20 (40 total horizontal padding)
  // Subtract both from window width to get actual available content width
  const contentWidth = width - 80;

  const baseStyle = useMemo(
    () => ({
      fontFamily: "SourceSansPro",
      lineHeight: 24,
      color: Colors[colorScheme].text,
    }),
    [colorScheme],
  );

  const content = (
    <Card>
      {title ? (
        <Heading style={{ marginBottom: 10 }}>{decode(title)}</Heading>
      ) : null}

      <RenderHtml
        source={{ html: text }}
        tagsStyles={styles}
        ignoredDomTags={IGNORED_DOM_TAGS}
        systemFonts={["SourceSansPro"]}
        contentWidth={contentWidth}
        baseStyle={baseStyle}
      />

      {subtitle}
    </Card>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View>{content}</View>;
};

export default SearchResultItem;
