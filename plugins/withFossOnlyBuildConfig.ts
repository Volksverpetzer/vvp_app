import { withAppBuildGradle } from "expo/config-plugins";

const withFossOnlyBuildConfig = (config: any) => {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /enableSeparateBuildPerCPUArchitecture\s*=\s*true/,
      "enableSeparateBuildPerCPUArchitecture = false",
    );
    return config;
  });
};

export default withFossOnlyBuildConfig;
