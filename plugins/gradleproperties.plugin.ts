// Taken from https://github.com/expo/expo/issues/30413#issuecomment-2432234303
import { withGradleProperties } from "expo/config-plugins";

function setGradlePropertiesValue(config: any, key: string, value: string) {
  return withGradleProperties(config, (exportedConfig: any) => {
    const keyIdx = exportedConfig.modResults.findIndex(
      (item: any) => item.type === "property" && item.key === key,
    );

    if (keyIdx !== -1) {
      exportedConfig.modResults.splice(keyIdx, 1, {
        type: "property",
        key,
        value,
      });
    } else {
      exportedConfig.modResults.push({
        type: "property",
        key,
        value,
      });
    }

    return exportedConfig;
  });
}

const withCustomPlugin = (config: any) => {
  config = setGradlePropertiesValue(
    config,
    "org.gradle.jvmargs",
    "-Xmx4096m -XX:MaxMetaspaceSize=1024m", // Set data of your choice
  );

  // @rive-app/react-native defaults to its experimental Android backend, which
  // throws on state machine inputs (UnsupportedOperationException: "SMI inputs
  // not supported in experimental API"). FaktenBot drives its animation through
  // such inputs, so keep the legacy backend until it moves to data binding.
  config = setGradlePropertiesValue(config, "USE_RIVE_LEGACY", "true");

  return config;
};

export default withCustomPlugin;
