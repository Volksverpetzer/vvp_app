import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
} from "expo/config-plugins";

/**
 * Expo config-plugin to inject `android:pathAdvancedPattern` into the
 * generated AndroidManifest.xml. Expo's `android.intentFilters[].data`
 * schema does not support this attribute, but Android 12+ uses it to
 * express exclusions (e.g. negative lookaheads). // cspell:disable-line
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

        // Remove the legacy path attributes — having both pathPattern and
        // pathAdvancedPattern on the same <data> element is invalid (Android
        // docs: only one path attribute per element). When both are present,
        // Android uses pathPattern and ignores pathAdvancedPattern entirely,
        // defeating the negative lookahead on API 31+.
        // On API < 31, pathAdvancedPattern is ignored and the element matches
        // all paths for this scheme+host (JS handles exclusions via External route).
        delete attrs["android:pathPattern"];
        delete attrs["android:pathPrefix"];
        attrs["android:pathAdvancedPattern"] =
          "^/(?!wp-content/uploads/|wp-admin/).+/.+/?$";
      }
    }

    return configWithManifest;
  });
};

export default withAndroidAppLinksExclusions;
