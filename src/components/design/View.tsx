import { View as DefaultView } from "react-native";

import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type ViewProperties = DefaultView["props"] & { key?: string };

const View = (properties: ViewProperties) => {
  const { style, ...otherProperties } = properties;
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;

  return (
    <DefaultView style={[{ backgroundColor }, style]} {...otherProperties} />
  );
};

export default View;
