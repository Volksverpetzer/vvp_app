import { TextInput as DefaultTextInput } from "react-native";

import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

type TextInputProperties = DefaultTextInput["props"] & { key?: string };

const TextInput = (properties: TextInputProperties) => {
  const { style, key, ...otherProperties } = properties;
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

export default TextInput;
