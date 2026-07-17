import { type ComponentProps, useState } from "react";
import type { ColorValue } from "react-native";
import { Switch, View } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
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

  return (
    <View style={{ paddingVertical: 20, paddingHorizontal: 20 }}>
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
            thumbColor: setting.value ? corporate : textMuted,
            trackColor: {
              // Dark track under the light grey thumb — the thumb itself is
              // textMuted, so the off-track must not use the same grey
              false: isDarkMode(colorScheme) ? surfaceDisabled : surfaceInput,
              true: primaryMuted,
            },
            disabled: pendingKeys.has(key),
            onValueChange: (value: boolean) => {
              setPendingKeys((prev) => new Set(prev).add(key));
              Promise.resolve(properties.saveSettings(value, key, setting))
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
            value: setting.value,
          };

          return (
            <View
              key={key}
              style={[globalStyles.row, { paddingTop: 20, maxHeight: 45 }]}
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
