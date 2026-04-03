import { View as DefaultView } from "react-native";

import { useThemeColor } from "#/hooks/useThemeColor";

type ViewProperties = DefaultView["props"] & { key?: string };

const View = (properties: ViewProperties) => {
  const { style, ...otherProperties } = properties;
  const backgroundColor = useThemeColor("background");

  return (
    <DefaultView style={[{ backgroundColor }, style]} {...otherProperties} />
  );
};

export default View;
