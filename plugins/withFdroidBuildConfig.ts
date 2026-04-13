import { withAppBuildGradle } from "expo/config-plugins";

const withFdroidBuildConfig = (config: any) => {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /enableSeparateBuildPerCPUArchitecture\s*=\s*true/,
      "enableSeparateBuildPerCPUArchitecture = false",
    );
    return config;
  });
};

export default withFdroidBuildConfig;
