import { ScrollView, StyleSheet, View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

export type ToastShareSheetProperties = {
  items: { title: string; onPress: () => void }[];
  onCancel: () => void;
};

const ToastShareSheet = ({ items, onCancel }: ToastShareSheetProperties) => {
  const colorScheme = useAppColorScheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <UiText size="lg" bold style={styles.title}>
        Teilen
      </UiText>
      <ScrollView style={styles.list}>
        {items.map((item, index) => (
          <UiPressable
            accessibilityRole="button"
            key={item.title + index}
            style={styles.button}
            onPress={item.onPress}
          >
            <UiText size="base" style={styles.buttonText}>
              {item.title}
            </UiText>
          </UiPressable>
        ))}
        <UiPressable
          accessibilityRole="button"
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <UiText
            size="base"
            bold
            style={[styles.buttonText, styles.cancelText]}
          >
            Abbrechen
          </UiText>
        </UiPressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: radii.sm,
    marginVertical: 4,
    padding: 12,
    width: "100%",
  },
  buttonText: {
    color: "#222",
  },
  cancelButton: {
    backgroundColor: "#ffeaea",
  },
  cancelText: {
    color: "#b00",
  },
  container: {
    alignItems: "center",
    borderRadius: radii.md,
    minWidth: 250,
    padding: 16,
  },
  list: {
    maxHeight: 300,
    width: "100%",
  },
  title: {
    color: "#333",
    marginBottom: 12,
  },
});

export default ToastShareSheet;
