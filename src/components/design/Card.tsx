import { View as DefaultView } from "react-native";

import { useThemeColor } from "#/hooks/useThemeColor";

export type CardProperties = DefaultView["props"] & {
  key?: string;
};

const Card = (properties: CardProperties) => {
  const { style, ...otherProperties } = properties;
  const backgroundColor = useThemeColor("background");

  return (
    <DefaultView
      style={[{ backgroundColor, borderRadius: 20, padding: 20 }, style]}
      {...otherProperties}
    />
  );
};

export default Card;
