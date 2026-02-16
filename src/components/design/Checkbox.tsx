import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { CheckboxIcon } from "#/components/Icons";

interface CheckboxProperties {
  checked: boolean;
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
      style={[styles.checkboxBase, checked && styles.checkboxChecked]}
      onPress={onPress}
    >
      {checked && <CheckboxIcon size={24} color="white" />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  checkboxBase: {
    backgroundColor: "transparent",
    borderColor: "coral",
    borderRadius: 4,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  checkboxChecked: {
    backgroundColor: "coral",
  },
});

export default Checkbox;
