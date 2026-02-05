import { decode } from "html-entities";
import { ReactNode, useMemo } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

import Card from "#/components/design/Card";
import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import useAppColorScheme from "#/hooks/useAppColorScheme";

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
  const { width } = useWindowDimensions();
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const highlightColor = Colors[colorScheme].highlight;
  const textColor = Colors[colorScheme].text;

  const tagStyles = useMemo(
    () => ({
      a: {
        color: corporate,
        textDecorationLine: "underline" as const,
        textDecorationColor: corporate,
      },
      em: {
        fontWeight: "bold" as const,
        color: highlightColor,
      },
      p: { color: textColor },
    }),
    [corporate, highlightColor, textColor],
  );

  const renderHtmlBaseStyle = useMemo(
    () => ({
      color: textColor,
      width: width - 60,
      maxHeight: 200,
      overflow: "hidden" as const,
    }),
    [textColor, width],
  );

  const content = (
    <Card style={{ padding: 20 }}>
      {title ? (
        <Text style={{ fontWeight: "bold", paddingBottom: 30 }}>
          {decode(title)}
        </Text>
      ) : null}

      <RenderHtml
        source={{ html: text }}
        baseStyle={renderHtmlBaseStyle}
        tagsStyles={tagStyles}
        contentWidth={width - 60}
        ignoredDomTags={IGNORED_DOM_TAGS}
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
