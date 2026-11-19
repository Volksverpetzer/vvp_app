import { withAppBuildGradle } from "expo/config-plugins";

// Play Console warning of 2026-11-17: the app is built for 16 KB memory page
// sizes, but two transitive native libraries were still compiled with NDK r25c,
// which can still crash on 16 KB devices:
// - libandroidx.graphics.path.so from androidx.graphics:graphics-path 1.0.1
//   (rive-android → androidx.compose.ui:ui → ui-graphics)
// - libdatastore_shared_counter.so from androidx.datastore 1.1.7
//   (expo-notifications → firebase-messaging → firebase-common)
// The versions below are built with NDK r27. Constraints only raise the
// minimum version; a dependency that already asks for something newer wins.
const GRAPHICS_PATH_VERSION = "1.1.0";
const DATASTORE_VERSION = "1.3.0";

const DATASTORE_MODULES = [
  "datastore",
  "datastore-android",
  "datastore-jvm",
  "datastore-core",
  "datastore-core-android",
  "datastore-core-jvm",
  "datastore-core-okio",
  "datastore-core-okio-jvm",
  "datastore-preferences",
  "datastore-preferences-android",
  "datastore-preferences-jvm",
  "datastore-preferences-core",
  "datastore-preferences-core-android",
  "datastore-preferences-core-jvm",
];

const START_MARKER = "// @generated begin withNativeLibConstraints";
const END_MARKER = "// @generated end withNativeLibConstraints";

const constraintLines = [
  `androidx.graphics:graphics-path:${GRAPHICS_PATH_VERSION}`,
  ...DATASTORE_MODULES.map(
    (module) => `androidx.datastore:${module}:${DATASTORE_VERSION}`,
  ),
]
  .map(
    (coordinate) =>
      `        implementation("${coordinate}") { because "16 KB page size: native lib built with NDK >= r27" }`,
  )
  .join("\n");

const constraintsBlock = `${START_MARKER}
// Pin transitive native libs to versions built with NDK r27+ (Play Console
// 16 KB page size warning, 2026-11-17)
dependencies {
    constraints {
${constraintLines}
    }
}
${END_MARKER}`;

const withNativeLibConstraints = (config: any) => {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;

    // Remove a previously generated block to avoid duplicates
    gradle = gradle.replaceAll(
      new RegExp(`\\n*${START_MARKER}[\\s\\S]*?${END_MARKER}\\n?`, "g"),
      "\n",
    );

    mod.modResults.contents = `${gradle.trimEnd()}\n\n${constraintsBlock}\n`;
    return mod;
  });
};

export default withNativeLibConstraints;
