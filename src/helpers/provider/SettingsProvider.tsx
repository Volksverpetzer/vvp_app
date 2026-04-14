import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import SettingsStore from "#/helpers/Stores/SettingsStore";
import type { AdvancedSettingType, ContentSettingType } from "#/types";

interface SettContextInterface {
  contentSettings: ContentSettingType;
  advancedSettings: AdvancedSettingType;
  setAdvancedSettings: (sett: AdvancedSettingType) => void;
  setContentSettings: (sett: ContentSettingType) => void;
}

export const SettingsContext = createContext<SettContextInterface>({
  contentSettings: SettingsStore.defaultContentSettings,
  advancedSettings: SettingsStore.defaultAdvancedSettings,
  setAdvancedSettings: (settings: AdvancedSettingType) => {
    SettingsStore.setAdvancedSettings(settings);
  },
  setContentSettings: (settings: ContentSettingType) => {
    SettingsStore.setContentSettings(settings);
  },
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [contentSettings, setContentSettings] = useState(
    SettingsStore.defaultContentSettings,
  );
  const [advancedSettings, setAdvancedSettings] = useState(
    SettingsStore.defaultAdvancedSettings,
  );
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      SettingsStore.getContentSettings(),
      SettingsStore.getAdvancedSettings(),
    ]).then(([contentSettings, advancedSettings]) => {
      setContentSettings((previous) => ({ ...previous, ...contentSettings }));
      setAdvancedSettings((previous) => ({ ...previous, ...advancedSettings }));
      setSettingsLoaded(true);
    });
  }, []);

  //propagate state changes to storage:
  useEffect(() => {
    SettingsStore.setAdvancedSettings(advancedSettings);
  }, [advancedSettings]);

  useEffect(() => {
    SettingsStore.setContentSettings(contentSettings);
  }, [contentSettings]);

  if (!settingsLoaded) {
    // Optionally, you could render a loading indicator here
    return;
  }

  return (
    <SettingsContext.Provider
      value={{
        contentSettings,
        setContentSettings,
        advancedSettings,
        setAdvancedSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
