import { TextInput as DefaultTextInput } from "react-native";

import { useThemeColor } from "#/hooks/useThemeColor";

type TextInputProperties = DefaultTextInput["props"] & { key?: string };

const TextInput = (properties: TextInputProperties) => {
  const { style, key, ...otherProperties } = properties;
  const backgroundColor = useThemeColor("inputBackground");
  const color = useThemeColor("text");

  return (
    <DefaultTextInput
      style={[{ backgroundColor, color }, style]}
      {...otherProperties}
    />
  );
};

export default TextInput;
