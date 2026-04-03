import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import UiText from "#/components/ui/UiText";

export type ToastShareSheetProperties = {
  items: { title: string; onPress: () => void }[];
  onCancel: () => void;
};

const ToastShareSheet = ({ items, onCancel }: ToastShareSheetProperties) => {
  return (
    <View style={styles.container}>
      <UiText style={styles.title}>Teilen</UiText>
      <ScrollView style={styles.list}>
        {items.map((item, index) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={item.title + index}
            style={styles.button}
            onPress={item.onPress}
          >
            <UiText style={styles.buttonText}>{item.title}</UiText>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <UiText style={[styles.buttonText, styles.cancelText]}>
            Abbrechen
          </UiText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginVertical: 4,
    padding: 12,
    width: "100%",
  },
  buttonText: {
    color: "#222",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#ffeaea",
  },
  cancelText: {
    color: "#b00",
    fontWeight: "bold",
  },
  container: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    minWidth: 250,
    padding: 16,
  },
  list: {
    maxHeight: 300,
    width: "100%",
  },
  title: {
    color: "#333",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
});

export default ToastShareSheet;
