import { withAppBuildGradle } from "expo/config-plugins";

const withSplitAbi = (config: any) => {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;

    // Remove any existing splits block to avoid duplicates
    gradle = gradle.replace(
      /\n\s*splits\s*\{\s*abi\s*\{[\s\S]*?\}\s*\}\s/g,
      "\n",
    );

    const splitsBlock = `
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "armeabi-v7a", "arm64-v8a"
        }
    }`;

    gradle = gradle.replace(/android\s*\{/, `android {${splitsBlock}\n`);

    mod.modResults.contents = gradle;
    return mod;
  });
};

export default withSplitAbi;
