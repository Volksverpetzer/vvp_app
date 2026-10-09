import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { CheckboxIcon, CloseIcon, EditIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import UiTextInput from "#/components/ui/UiTextInput";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { fontSizes } from "#/constants/FontSizes";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
import {
  getApiUrl,
  getApiUrlOverride,
  normalizeApiUrl,
  setApiUrlOverride,
} from "#/helpers/apiUrl";
import { toast } from "#/helpers/toast";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

/**
 * Lets FOSS users point the app at a different (e.g. self-hosted) app
 * server. Applies to every request from the next one on; content already
 * loaded stays until it is refreshed.
 *
 * The field is read-only until the pen is pressed; while editing, the pen
 * is replaced by save and cancel icons. Once a custom server is saved, a
 * link below the field resets it to the default.
 */
const ApiUrlSetting = () => {
  const colorScheme = useAppColorScheme();
  const { primary, surfaceInput, text, textMuted } = Colors[colorScheme];
  const [value, setValue] = useState<string>(getApiUrl());
  const [editing, setEditing] = useState(false);
  const [isCustom, setIsCustom] = useState(!!getApiUrlOverride());

  const save = async () => {
    const url = normalizeApiUrl(value);
    if (!url) {
      toast.error(
        "Ungültige Adresse",
        "Bitte gib eine vollständige https-Adresse ein.",
      );
      return;
    }
    setValue(url);
    setEditing(false);
    if (url === getApiUrl()) return;
    await setApiUrlOverride(url);
    setIsCustom(!!getApiUrlOverride());
    toast.success("Server gespeichert", url);
  };

  const cancel = () => {
    setValue(getApiUrl());
    setEditing(false);
  };

  const reset = async () => {
    await setApiUrlOverride(undefined);
    setValue(Config.apiUrl);
    setIsCustom(false);
    toast.success("Server zurückgesetzt", Config.apiUrl);
  };

  return (
    <View style={styles.container}>
      <UiText size="base">App-Server</UiText>
      <View style={[styles.field, { backgroundColor: surfaceInput }]}>
        <UiTextInput
          accessibilityLabel="App-Server-Adresse"
          accessibilityHint="Adresse des Servers, von dem die App Inhalte lädt"
          value={value}
          onChangeText={setValue}
          editable={editing}
          autoFocus={editing}
          placeholder={Config.apiUrl}
          placeholderTextColor={textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onSubmitEditing={save}
          style={[styles.input, { color: editing ? text : textMuted }]}
        />
        {editing ? (
          <>
            <UiPressable
              accessibilityRole="button"
              accessibilityLabel="Abbrechen"
              accessibilityHint="Verwirft die Änderung"
              onPress={cancel}
              style={styles.iconButton}
            >
              <CloseIcon size={iconSizes.md} color={textMuted} />
            </UiPressable>
            <UiPressable
              accessibilityRole="button"
              accessibilityLabel="Speichern"
              accessibilityHint="Speichert die Adresse"
              onPress={save}
              style={styles.iconButton}
            >
              <CheckboxIcon size={iconSizes.md} color={primary} />
            </UiPressable>
          </>
        ) : (
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel="App-Server bearbeiten"
            accessibilityHint="Macht die Adresse bearbeitbar"
            onPress={() => setEditing(true)}
            style={styles.iconButton}
          >
            <EditIcon size={iconSizes.md} color={primary} />
          </UiPressable>
        )}
      </View>
      {isCustom && !editing && (
        <UiPressable
          accessibilityRole="button"
          accessibilityHint="Setzt die Adresse auf den Standard-Server zurück"
          onPress={reset}
          style={styles.resetLink}
        >
          <UiText size="sm" bold style={{ color: primary }}>
            Zurücksetzen
          </UiText>
        </UiPressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    minHeight: spacing.huge + spacing.xs,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: fontSizes.base,
    paddingVertical: spacing.md,
  },
  iconButton: {
    padding: spacing.sm,
  },
  resetLink: {
    alignSelf: "flex-end",
  },
});

export default ApiUrlSetting;
