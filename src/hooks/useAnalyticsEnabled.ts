import { useContext } from "react";

import Config from "#/constants/Config";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";

const useAnalyticsEnabled = (): boolean => {
  const { advancedSettings } = useContext(SettingsContext);

  return (
    Config.enableAnalytics &&
    (advancedSettings?.plausibleAnalytics?.value ?? true)
  );
};

export default useAnalyticsEnabled;
