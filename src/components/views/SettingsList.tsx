import { useEffect, useState } from "react";
import { Switch, View } from "react-native";

import Colors from "../../constants/Colors";
import Config from "../../constants/Config";
import { styles } from "../../constants/Styles";
import SettingsStore from "../../helpers/Stores/SettingsStore";
import { getEnabledFeeds } from "../../helpers/feeds";
import useColorScheme from "../../hooks/useColorScheme";
import { ContentSettingType, SettingType } from "../../types";
import Text from "../design/Text";

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

const SettingsList = (properties: SettingsListProperties) => {
  const [disabled, setDisabled] = useState(false);
  const [update, setUpdate] = useState(false);
  useEffect(() => {
    setDisabled(false);
  }, [properties.settings, update]);
  const colorScheme = useColorScheme();
  const corporate = Colors[colorScheme].corporate;
  const activeColor = Colors[colorScheme].tint;
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
          return (
            <View
              key={key}
              style={{
                ...styles.row,
                paddingVertical: 10,
                maxHeight: 45,
              }}
            >
              <Text style={{ fontSize: 16 }}>{setting.name}</Text>
              <Switch
                testID="settingSwitch"
                trackColor={{ false: "#E6E6E6", true: activeColor }}
                thumbColor={setting.value ? corporate : "#C4C4C4"}
                ios_backgroundColor={activeColor}
                disabled={disabled}
                onValueChange={(value) => {
                  setDisabled(true);
                  properties.saveSettings(value, key, setting, setUpdate);
                  setUpdate(false);
                }}
                style={{ marginTop: -2 }}
                value={setting.value}
              />
            </View>
          );
        })}
    </View>
  );
};

export default SettingsList;
