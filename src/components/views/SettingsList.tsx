import { type ComponentProps, useEffect, useState } from "react";
import { Switch, View } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import SettingsStore from "#/helpers/Stores/SettingsStore";
import { isDarkMode } from "#/helpers/utils/color";
import { getEnabledFeeds } from "#/helpers/utils/feeds";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { ContentSettingType, SettingType } from "#/types";

interface SettingsListProperties {
  saveSettings: (
    value: boolean,
    key: string,
    setting: SettingType,
    setUpdate?: (arg0: boolean) => void,
  ) => void;
  settings: {
    [id: string]: SettingType;
  };
}

// Extend native Switch props locally to allow `activeThumbColor` which
// is accepted at runtime but may be missing from the RN typings used in this project.
// See https://stackoverflow.com/a/73313139
type ExtendedSwitchProps = ComponentProps<typeof Switch> & {
  activeThumbColor?: string;
  activeTrackColor?: string;
};

const SettingsList = (properties: SettingsListProperties) => {
  const [disabled, setDisabled] = useState(false);
  const [update, setUpdate] = useState(false);
  useEffect(() => {
    setDisabled(false);
  }, [properties.settings, update]);
  const colorScheme = useAppColorScheme();
  const {
    corporate,
    corporateTint,
    grayedOutText,
    tabIconDefault,
    secondaryBackground,
    inputBackground,
    tabIconSelected,
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
            !activeSettings.includes(key as keyof ContentSettingType)
          )
            return;

          // Build the Switch props in a local object so we can add runtime-only props
          // (like `activeThumbColor`) without TypeScript complaining about them.
          const switchProps: ExtendedSwitchProps = {
            testID: "settingSwitch",
            activeTrackColor: corporateTint,
            activeThumbColor: corporate,
            ios_backgroundColor: isDarkMode(colorScheme) // ios only
              ? secondaryBackground
              : tabIconSelected,
            thumbColor: setting.value ? corporate : tabIconDefault,
            trackColor: {
              false: isDarkMode(colorScheme) ? grayedOutText : inputBackground,
              true: isDarkMode(colorScheme) ? corporateTint : corporateTint,
            },
            disabled,
            onValueChange: (value: boolean) => {
              setDisabled(true);
              properties.saveSettings(value, key, setting, setUpdate);
              setUpdate(false);
            },
            value: setting.value,
          };

          return (
            <View
              key={key}
              style={{
                ...styles.row,
                paddingTop: 20,
                maxHeight: 45,
              }}
            >
              <UiText style={{ fontSize: 16 }}>{setting.name}</UiText>
              {/* cast to native Switch props to satisfy TypeScript while keeping runtime props */}
              <Switch {...(switchProps as ComponentProps<typeof Switch>)} />
            </View>
          );
        })}
    </View>
  );
};

export default SettingsList;
