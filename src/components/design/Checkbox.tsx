import { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { CheckboxIcon } from "#/components/Icons";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

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

  const colorScheme = useAppColorScheme();
  const highlight = Colors[colorScheme].highlight;

  const style = useMemo(() => ({ borderColor: highlight }), [highlight]);
  const checkedStyle = useMemo(
    () => (checked ? { backgroundColor: highlight } : undefined),
    [checked, highlight],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked }}
      style={[styles.checkboxBase, style, checkedStyle]}
      onPress={onPress}
    >
      {checked && <CheckboxIcon size={24} color="white" />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  checkboxBase: {
    backgroundColor: "transparent",
    borderRadius: 4,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
});

export default Checkbox;
