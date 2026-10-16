import { useState } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Platform, View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiSwitch from "#/components/ui/UiSwitch";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { LINE_HEIGHTS } from "#/constants/FontSizes";
import { globalStyles } from "#/constants/GlobalStyles";
import SettingsStore from "#/helpers/Stores/SettingsStore";
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
  style?: StyleProp<ViewStyle>;
}

// Shared by every settings row (switches, backup actions) so rows sit on the
// same rhythm across sections. Also the platform's minimum touch target:
// 44pt on iOS (HIG), 48dp elsewhere (Material).
export const SETTINGS_ROW_MIN_HEIGHT = Platform.select({
  ios: 44,
  default: 48,
});

// Settings texts use a fixed line height so their position is predictable:
// a row centers its single-line label, so padding a text block by the same
// inset puts its first line exactly where a row's label would be — also when
// the text wraps. Keeps every section's first line at the same distance from
// its title, whether it starts with an intro text or a switch.
export const settingsTextStyle: TextStyle = { lineHeight: LINE_HEIGHTS.base };

export const settingsTextRowStyle: ViewStyle = {
  paddingVertical: (SETTINGS_ROW_MIN_HEIGHT - LINE_HEIGHTS.base) / 2,
};

const SettingsList = (properties: SettingsListProperties) => {
  // Tracks in-flight saves per key, not globally, so toggling one switch
  // doesn't disable/grey out its siblings while its save is pending.
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const colorScheme = useAppColorScheme();
  const { textMuted } = Colors[colorScheme];
  const activeSettings = getEnabledFeeds(Config.feeds);
  const { disabled, disabledMessage, onDisabledPress, style } = properties;

  // No outer padding: the surrounding container (e.g. SettingsSection) owns it.
  return (
    <View style={style}>
      {disabled &&
        disabledMessage &&
        (onDisabledPress ? (
          <UiPressable
            accessibilityRole="button"
            onPress={onDisabledPress}
            style={settingsTextRowStyle}
          >
            <UiText
              size="base"
              style={[settingsTextStyle, { color: textMuted }]}
            >
              {disabledMessage}
            </UiText>
          </UiPressable>
        ) : (
          <View style={settingsTextRowStyle}>
            <UiText
              size="base"
              style={[settingsTextStyle, { color: textMuted }]}
            >
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

          if (Config.hiddenNotifications?.includes(key as never)) return;

          return (
            <View
              key={key}
              style={[globalStyles.row, { minHeight: SETTINGS_ROW_MIN_HEIGHT }]}
            >
              <UiText size="base" style={settingsTextStyle}>
                {setting.name}
              </UiText>
              <UiSwitch
                testID="settingSwitch"
                value={disabled ? false : setting.value}
                disabled={disabled || pendingKeys.has(key)}
                onValueChange={(value) => {
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
                }}
              />
            </View>
          );
        })}
    </View>
  );
};

export default SettingsList;
