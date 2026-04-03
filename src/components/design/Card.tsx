import { View as DefaultView } from "react-native";

import { useThemeColor } from "#/hooks/useThemeColor";

export type CardProperties = DefaultView["props"] & {
  key?: string;
  backgroundVariant?: "primary" | "secondary";
};

const Card = (properties: CardProperties) => {
  const {
    style,
    backgroundVariant = "primary",
    ...otherProperties
  } = properties;
  const backgroundColor = useThemeColor(
    backgroundVariant === "secondary" ? "secondaryBackground" : "background",
  );

  return (
    <DefaultView
      style={[{ backgroundColor, borderRadius: 20, padding: 20 }, style]}
      {...otherProperties}
    />
  );
};

export default Card;
