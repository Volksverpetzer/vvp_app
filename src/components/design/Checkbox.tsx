import { useState } from "react";
import { Pressable, ViewStyle } from "react-native";

import { Checkbox as CheckboxIcon } from "#/components/Icons";
import { styles } from "#/constants/Styles";

interface CheckboxProperties {
  checked: boolean;
  style?: ViewStyle;
  onChange: (checked: boolean) => void;
}

const Checkbox = (properties: CheckboxProperties) => {
  const [checked, setChecked] = useState(properties.checked);
  const onPress = () => {
    setChecked(!checked);
    properties.onChange(!checked);
  };
  return (
    <Pressable
      accessibilityRole="button"
      style={[
        properties.style,
        styles.checkboxBase,
        checked && styles.checkboxChecked,
      ]}
      onPress={onPress}
    >
      {checked && <CheckboxIcon size={24} color="white" />}
    </Pressable>
  );
};

export default Checkbox;
