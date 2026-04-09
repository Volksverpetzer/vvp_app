import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
} from "expo/config-plugins";

/**
 * Expo config-plugin to inject `android:pathAdvancedPattern` into the
 * generated AndroidManifest.xml. Expo's `android.intentFilters[].data`
 * schema does not support this attribute, but Android 12+ uses it to
 * express exclusions (e.g. negative lookaheads).
 */
const withAndroidAppLinksExclusions: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (configWithManifest) => {
    const manifest = configWithManifest.modResults;

    const mainActivity =
      AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
    const intentFilters = mainActivity["intent-filter"];
    if (!Array.isArray(intentFilters)) {
      return configWithManifest;
    }

    for (const intentFilter of intentFilters) {
      const actions = intentFilter.action;
      const hasViewAction =
        Array.isArray(actions) &&
        actions.some(
          (a) => a?.$?.["android:name"] === "android.intent.action.VIEW",
        );
      if (!hasViewAction) continue;

      const dataEntries = intentFilter.data;
      if (!Array.isArray(dataEntries)) continue;

      for (const dataEntry of dataEntries) {
        const attrs = dataEntry?.$;
        if (!attrs) continue;

        const scheme = attrs["android:scheme"];
        const host = attrs["android:host"];

        if (scheme !== "https" || host !== "www.volksverpetzer.de") continue;

        // Keep the original simple-glob `android:pathPattern` for older Android,
        // but exclude /wp-content/uploads/ and /wp-admin/ on Android 12+ (API 31+).
        // Also keep the "two segments" behavior (.+/.+) used by the legacy pattern.
        attrs["android:pathAdvancedPattern"] =
          "^/(?!wp-content/uploads/|wp-admin/).+/.+$";
      }
    }

    return configWithManifest;
  });
};

export default withAndroidAppLinksExclusions;
