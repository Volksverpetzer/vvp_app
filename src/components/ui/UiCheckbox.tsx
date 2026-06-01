import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { CheckboxIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface UiCheckboxProperties {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
}

const UiCheckbox = (properties: UiCheckboxProperties) => {
  const { checked, onChange, children } = properties;
  const colorScheme = useAppColorScheme();
  const highlight = Colors[colorScheme].accent;

  const style = useMemo(() => ({ borderColor: highlight }), [highlight]);
  const checkedStyle = useMemo(
    () => (checked ? { backgroundColor: highlight } : undefined),
    [checked, highlight],
  );

  return (
    <UiPressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.row]}
      onPress={() => onChange(!checked)}
    >
      <View style={[styles.checkboxBase, style, checkedStyle]}>
        {checked && <CheckboxIcon size={24} color="white" />}
      </View>
      {children}
    </UiPressable>
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
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
  },
});

export default UiCheckbox;
