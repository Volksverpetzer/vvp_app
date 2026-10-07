import { useState } from "react";
import { View } from "react-native";

import UiPressable from "#/components/ui/UiPressable";
import UiSwitch from "#/components/ui/UiSwitch";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
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
}

const SettingsList = (properties: SettingsListProperties) => {
  // Tracks in-flight saves per key, not globally, so toggling one switch
  // doesn't disable/grey out its siblings while its save is pending.
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const colorScheme = useAppColorScheme();
  const { textMuted } = Colors[colorScheme];
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

          if (Config.hiddenNotifications?.includes(key as never)) return;

          return (
            <View
              key={key}
              style={[
                globalStyles.row,
                { paddingTop: spacing.xl, maxHeight: 45 },
              ]}
            >
              <UiText size="base">{setting.name}</UiText>
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
