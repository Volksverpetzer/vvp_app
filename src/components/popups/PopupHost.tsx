import { useSyncExternalStore } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import UiButton from "#/components/ui/UiButton";
import UiModal from "#/components/ui/UiModal";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { popupStore } from "#/helpers/popups";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const dismiss = () => popupStore.answer(null);

/**
 * Renders whatever `popups.confirm` / `popups.choose` asked for. Mounted once
 * in the root layout.
 */
const PopupHost = () => {
  const { request, visible } = useSyncExternalStore(
    popupStore.subscribe,
    popupStore.getState,
  );
  const colorScheme = useAppColorScheme();
  const background = Colors[colorScheme].background;

  if (!request) return null;

  if (request.kind === "confirm") {
    return (
      <UiModal
        isVisible={visible}
        onClose={() => popupStore.answer(false)}
        onClosed={popupStore.closed}
        variant="dialog"
        title={request.title}
        testID="popup-confirm"
      >
        <UiSpace size={spacing.md} />
        <UiText size="base">{request.message}</UiText>
        <UiSpace size={spacing.xl} />
        <View style={styles.buttons}>
          <UiButton
            label={request.cancelLabel ?? "Abbrechen"}
            variant="secondary"
            onPress={() => popupStore.answer(false)}
            style={styles.button}
          />
          <UiButton
            label={request.confirmLabel}
            variant="primary"
            onPress={() => popupStore.answer(true)}
            style={styles.button}
          />
        </View>
      </UiModal>
    );
  }

  return (
    <UiModal
      isVisible={visible}
      onClose={dismiss}
      onClosed={popupStore.closed}
      variant="sheet"
      title={request.title}
      testID="popup-choose"
    >
      <UiSpace size={spacing.lg} />
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {request.options.map((option, index) => (
          <UiPressable
            accessibilityRole="button"
            key={option + index}
            style={[styles.option, { backgroundColor: background }]}
            onPress={() => popupStore.answer(index)}
          >
            <UiText size="base">{option}</UiText>
          </UiPressable>
        ))}
      </ScrollView>
    </UiModal>
  );
};

const styles = StyleSheet.create({
  buttons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    gap: spacing.sm,
  },
  option: {
    borderRadius: radii.sm,
    padding: spacing.md,
  },
});

export default PopupHost;
