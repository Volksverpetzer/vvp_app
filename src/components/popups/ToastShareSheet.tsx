import { ScrollView, StyleSheet, View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
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
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {items.map((item, index) => (
          <UiPressable
            accessibilityRole="button"
            key={item.title + index}
            style={[
              styles.button,
              { backgroundColor: Colors[colorScheme].surface },
            ]}
            onPress={item.onPress}
          >
            <UiText size="base">{item.title}</UiText>
          </UiPressable>
        ))}
        <UiPressable
          accessibilityRole="button"
          style={[
            styles.button,
            { backgroundColor: Colors[colorScheme].surfaceError },
          ]}
          onPress={onCancel}
        >
          <UiText
            size="base"
            bold
            style={{ color: Colors[colorScheme].onError }}
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
    borderRadius: radii.sm,
    padding: spacing.md,
    width: "100%",
  },
  container: {
    alignItems: "center",
    borderRadius: radii.md,
    minWidth: 250,
    padding: spacing.lg,
  },
  list: {
    maxHeight: 300,
    width: "100%",
  },
  title: {
    marginBottom: spacing.md,
  },
});

export default ToastShareSheet;
