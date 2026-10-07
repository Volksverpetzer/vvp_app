import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { EditIcon, ResetIcon } from "#/components/Icons";
import UiButton from "#/components/ui/UiButton";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import UiTextInput from "#/components/ui/UiTextInput";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
import {
  getApiUrl,
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
 * turns into a reset icon that fills in the default server, and nothing is
 * stored until the change is saved.
 */
const ApiUrlSetting = () => {
  const colorScheme = useAppColorScheme();
  const { primary, textMuted } = Colors[colorScheme];
  const [value, setValue] = useState<string>(getApiUrl());
  const [editing, setEditing] = useState(false);

  const save = async () => {
    const url = normalizeApiUrl(value);
    if (!url) {
      toast.error(
        "Ungültige Adresse",
        "Bitte gib eine vollständige https-Adresse ein.",
      );
      return;
    }
    await setApiUrlOverride(url);
    setValue(url);
    setEditing(false);
    toast.success("Server gespeichert", url);
  };

  const cancel = () => {
    setValue(getApiUrl());
    setEditing(false);
  };

  const isDefault = normalizeApiUrl(value) === Config.apiUrl;

  return (
    <View style={styles.container}>
      <UiText size="base">App-Server</UiText>
      <View style={styles.inputRow}>
        <UiTextInput
          accessibilityLabel="App-Server-Adresse"
          accessibilityHint="Adresse des Servers, von dem die App Inhalte lädt"
          value={value}
          onChangeText={setValue}
          editable={editing}
          placeholder={Config.apiUrl}
          placeholderTextColor={textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onSubmitEditing={save}
          style={[styles.input, !editing && { color: textMuted }]}
        />
        {editing ? (
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel="Standard-Server einsetzen"
            accessibilityHint="Setzt die Adresse auf den Standard-Server zurück"
            onPress={() => setValue(Config.apiUrl)}
            disabled={isDefault}
            style={styles.iconButton}
          >
            <ResetIcon
              size={iconSizes.md}
              color={isDefault ? textMuted : primary}
            />
          </UiPressable>
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
      <UiText size="sm" style={{ color: textMuted }}>
        Standard: {Config.apiUrl}
      </UiText>
      {editing && (
        <View style={styles.buttons}>
          <UiButton label="Speichern" onPress={save} style={styles.button} />
          <UiButton
            label="Abbrechen"
            variant="secondary"
            onPress={cancel}
            style={styles.button}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  input: {
    ...globalStyles.input,
    flex: 1,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  iconButton: {
    padding: spacing.sm,
  },
  buttons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});

export default ApiUrlSetting;
