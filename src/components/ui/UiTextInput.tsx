import { TextInput as DefaultTextInput } from "react-native";

import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type UiTextInputProperties = DefaultTextInput["props"];

const UiTextInput = (properties: UiTextInputProperties) => {
  const { style, ...otherProperties } = properties;
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].inputBackground;
  const color = Colors[colorScheme].text;

  return (
    <DefaultTextInput
      style={[{ backgroundColor, color }, style]}
      {...otherProperties}
    />
  );
};

export default UiTextInput;
