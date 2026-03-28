import { withAppBuildGradle } from "@expo/config-plugins";
import type { ConfigPlugin } from "@expo/config-plugins";

const withFossBuild: ConfigPlugin = (config) =>
  withAppBuildGradle(config, (gradleConfig) => {
    let { contents } = gradleConfig.modResults;

    // Remove Stripe dependency (autolinked line)
    contents = contents.replace(
      /^\s*implementation\s+project\(['"].*stripe.*['"]\).*$/gm,
      "// FOSS: Stripe removed",
    );

    // Remove installreferrer from expo-application
    contents = contents.replace(
      /^\s*implementation\s+['"]com\.android\.installreferrer.*$/gm,
      "// FOSS: installreferrer removed",
    );

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });

export default withFossBuild;
