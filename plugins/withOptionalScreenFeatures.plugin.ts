import { withAndroidManifest } from "expo/config-plugins";

// `orientation: "portrait"` sets `screenOrientation="portrait"` on the main
// activity, which makes Google Play infer a required
// `android.hardware.screen.portrait` feature. Play then rejects the release
// because the feature limits availability on tablets, desktops and Android XR.
// Declaring the feature explicitly as optional keeps the portrait lock but
// lets those devices install the app.
const OPTIONAL_FEATURES = [
  "android.hardware.screen.portrait",
  "android.hardware.screen.landscape",
];

const withOptionalScreenFeatures = (config: any) => {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const features = (manifest["uses-feature"] ??= []);

    for (const name of OPTIONAL_FEATURES) {
      const existing = features.find((f) => f.$["android:name"] === name);
      if (existing) {
        existing.$["android:required"] = "false";
      } else {
        features.push({
          $: { "android:name": name, "android:required": "false" },
        });
      }
    }

    return mod;
  });
};

export default withOptionalScreenFeatures;
