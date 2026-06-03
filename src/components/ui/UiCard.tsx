import { View } from "react-native";

import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

export type UiCardProperties = View["props"];

const UiCard = ({ style, ...otherProperties }: UiCardProperties) => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;

  return (
    <View
      style={[{ backgroundColor, borderRadius: 20, padding: 20 }, style]}
      {...otherProperties}
    />
  );
};

export default UiCard;
