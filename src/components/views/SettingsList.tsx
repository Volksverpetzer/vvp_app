import { type ComponentProps, useState } from "react";
import type { ColorValue } from "react-native";
import { Switch, View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import SettingsStore from "#/helpers/Stores/SettingsStore";
import { isDarkMode } from "#/helpers/utils/color";
import { getEnabledFeeds } from "#/helpers/utils/feeds";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { FeedKey, SettingType } from "#/types";

interface SettingsListProperties {
  saveSettings: (
    value: boolean,
    key: string,
    setting: SettingType,
  ) => void | Promise<void>;
  settings: {
    [id: string]: SettingType;
  };
  // Used when every switch in this list is gated behind a single external
  // permission (e.g. OS notification permission) that's been denied — the
  // switches can't do anything until the user re-enables it in Settings.
  disabled?: boolean;
  disabledMessage?: string;
  onDisabledPress?: () => void;
}

// Extend native Switch props locally to allow `activeThumbColor` which
// is accepted at runtime but may be missing from the RN typings used in this project.
// See https://stackoverflow.com/a/73313139
type ExtendedSwitchProps = ComponentProps<typeof Switch> & {
  activeThumbColor?: ColorValue;
  activeTrackColor?: ColorValue;
};

const SettingsList = (properties: SettingsListProperties) => {
  // Tracks in-flight saves per key, not globally, so toggling one switch
  // doesn't disable/grey out its siblings while its save is pending.
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const colorScheme = useAppColorScheme();
  const {
    primary: corporate,
    primaryMuted,
    textMuted,
    surface,
    surfaceDisabled,
    surfaceInput,
    onPrimary,
  } = Colors[colorScheme];
  const activeSettings = getEnabledFeeds(Config.feeds);
  const { disabled, disabledMessage, onDisabledPress } = properties;

  return (
    <View
      style={{ paddingVertical: spacing.xl, paddingHorizontal: spacing.xl }}
    >
      {disabled &&
        disabledMessage &&
        (onDisabledPress ? (
          <UiPressable
            accessibilityRole="button"
            onPress={onDisabledPress}
            style={{ paddingBottom: spacing.md }}
          >
            <UiText size="base" style={{ color: textMuted }}>
              {disabledMessage}
            </UiText>
          </UiPressable>
        ) : (
          <View style={{ paddingBottom: spacing.md }}>
            <UiText size="base" style={{ color: textMuted }}>
              {disabledMessage}
            </UiText>
          </View>
        ))}
      {Object.keys(properties.settings)
        .sort((keyA, keyB) => {
          return properties.settings[keyA].name.localeCompare(
            properties.settings[keyB].name,
          );
        })
        .map((key) => {
          const setting = properties.settings[key];
          if (
            Object.keys(SettingsStore.defaultContentSettings).includes(key) &&
            !activeSettings.includes(key as FeedKey)
          )
            return;

          // Build the Switch props in a local object so we can add runtime-only props
          // (like `activeThumbColor`) without TypeScript complaining about them.
          const switchProps: ExtendedSwitchProps = {
            testID: "settingSwitch",
            activeTrackColor: primaryMuted,
            activeThumbColor: corporate,
            ios_backgroundColor: isDarkMode(colorScheme) // ios only
              ? surface
              : onPrimary,
            thumbColor: setting.value && !disabled ? corporate : textMuted,
            trackColor: {
              // Dark track under the light grey thumb — the thumb itself is
              // textMuted, so the off-track must not use the same grey
              false: isDarkMode(colorScheme) ? surfaceDisabled : surfaceInput,
              true: primaryMuted,
            },
            disabled: disabled || pendingKeys.has(key),
            onValueChange: (value: boolean) => {
              setPendingKeys((prev) => new Set(prev).add(key));
              Promise.resolve()
                .then(() => properties.saveSettings(value, key, setting))
                .catch((error) => {
                  console.error("Error saving setting:", error);
                })
                .finally(() => {
                  setPendingKeys((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                  });
                });
            },
            value: disabled ? false : setting.value,
          };

          return (
            <View
              key={key}
              style={[
                globalStyles.row,
                { paddingTop: spacing.xl, maxHeight: 45 },
              ]}
            >
              <UiText size="base">{setting.name}</UiText>
              {/* cast to native Switch props to satisfy TypeScript while keeping runtime props */}
              <Switch {...(switchProps as ComponentProps<typeof Switch>)} />
            </View>
          );
        })}
    </View>
  );
};

export default SettingsList;
