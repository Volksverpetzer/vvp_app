import { View as DefaultView } from "react-native";

import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

export type CardProperties = DefaultView["props"] & {
  key?: string;
};

const Card = (properties: CardProperties) => {
  const { style, ...otherProperties } = properties;
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;

  return (
    <DefaultView
      style={[{ backgroundColor, borderRadius: 20, padding: 20 }, style]}
      {...otherProperties}
    />
  );
};

export default Card;
