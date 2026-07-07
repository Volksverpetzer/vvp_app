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
      style={[
        { backgroundColor, color },
        // Android vertically centers multiline text by default; start at
        // the top like iOS does (no-op on single-line inputs and iOS)
        properties.multiline ? { textAlignVertical: "top" } : undefined,
        style,
      ]}
      {...otherProperties}
    />
  );
};

export default UiTextInput;
