import { View } from "react-native";

import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { CARD_PADDING } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

export type UiCardProperties = View["props"];

const UiCard = ({ style, ...otherProperties }: UiCardProperties) => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;

  return (
    <View
      style={[
        { backgroundColor, borderRadius: radii.xl, padding: CARD_PADDING },
        style,
      ]}
      {...otherProperties}
    />
  );
};

export default UiCard;
