import { decode } from "html-entities";
import { ReactNode, useMemo } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

import Card from "#/components/design/Card";
import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import { styles as globalStyles } from "#/constants/Styles";
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

  const baseStyle = useMemo(
    () => ({
      fontFamily: "SourceSansPro",
      lineHeight: 27,
      color: Colors[colorScheme].text,
    }),
    [colorScheme],
  );

  const content = (
    <Card>
      {title ? <Text style={globalStyles.heading}>{decode(title)}</Text> : null}

      <RenderHtml
        source={{ html: text }}
        tagsStyles={styles}
        ignoredDomTags={IGNORED_DOM_TAGS}
        contentWidth={width}
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
