import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import SettingsStore from "#/helpers/Stores/SettingsStore";
import { loadApiUrlOverride } from "#/helpers/apiUrl";
import type {
  AdvancedSettingType,
  ContentSettingType,
  ThemePreference,
} from "#/types";

interface SettContextInterface {
  contentSettings: ContentSettingType;
  advancedSettings: AdvancedSettingType;
  setAdvancedSettings: (sett: AdvancedSettingType) => void;
  setContentSettings: (sett: ContentSettingType) => void;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
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
  themePreference: SettingsStore.defaultThemePreference,
  setThemePreference: (preference: ThemePreference) => {
    SettingsStore.setThemePreference(preference);
  },
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [contentSettings, setContentSettings] = useState<ContentSettingType>(
    SettingsStore.defaultContentSettings,
  );
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettingType>(
    SettingsStore.defaultAdvancedSettings,
  );
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    SettingsStore.defaultThemePreference,
  );
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      SettingsStore.getContentSettings(),
      SettingsStore.getAdvancedSettings(),
      SettingsStore.getThemePreference(),
      // Resolved before children render so no request goes out to the
      // default server when the user has configured their own.
      loadApiUrlOverride(),
    ])
      .then(([contentSettings, advancedSettings, themePreference]) => {
        setContentSettings((previous) => ({ ...previous, ...contentSettings }));
        setAdvancedSettings((previous) => ({
          ...previous,
          ...advancedSettings,
        }));
        setThemePreferenceState(themePreference);
      })
      .catch(console.error)
      .finally(() => setSettingsLoaded(true));
  }, []);

  //propagate state changes to storage:
  useEffect(() => {
    SettingsStore.setAdvancedSettings(advancedSettings);
  }, [advancedSettings]);

  useEffect(() => {
    SettingsStore.setContentSettings(contentSettings);
  }, [contentSettings]);

  // Persisted from the setter rather than an effect, so the default value
  // isn't written over the stored one before it has been loaded.
  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    SettingsStore.setThemePreference(preference);
  }, []);

  const contextValue = useMemo(
    () => ({
      contentSettings,
      setContentSettings,
      advancedSettings,
      setAdvancedSettings,
      themePreference,
      setThemePreference,
    }),
    [
      contentSettings,
      advancedSettings,
      setContentSettings,
      setAdvancedSettings,
      themePreference,
      setThemePreference,
    ],
  );

  if (!settingsLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};
