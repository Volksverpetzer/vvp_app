import { useState } from "react";
import { StyleSheet, View } from "react-native";

import UiButton from "#/components/ui/UiButton";
import UiText from "#/components/ui/UiText";
import UiTextInput from "#/components/ui/UiTextInput";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
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
 */
const ApiUrlSetting = () => {
  const colorScheme = useAppColorScheme();
  const { textMuted } = Colors[colorScheme];
  const [value, setValue] = useState<string>(getApiUrl());
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
    await setApiUrlOverride(url);
    setValue(url);
    setIsCustom(!!getApiUrlOverride());
    toast.success("Server gespeichert", url);
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
      <UiTextInput
        accessibilityLabel="App-Server-Adresse"
        accessibilityHint="Adresse des Servers, von dem die App Inhalte lädt"
        value={value}
        onChangeText={setValue}
        placeholder={Config.apiUrl}
        placeholderTextColor={textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onSubmitEditing={save}
        style={styles.input}
      />
      <UiText size="sm" style={{ color: textMuted }}>
        Standard: {Config.apiUrl}
      </UiText>
      <View style={styles.buttons}>
        <UiButton label="Speichern" onPress={save} style={styles.button} />
        <UiButton
          label="Zurücksetzen"
          variant="secondary"
          onPress={reset}
          disabled={!isCustom}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  input: {
    ...globalStyles.input,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
