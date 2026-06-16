import type { ConfigContext, ExpoConfig } from "@expo/config";
import { loadModuleSync } from "@expo/require-utils";
import path from "node:path";

import type vvpConfig from "./config/volksverpetzer.config";
import * as pkg from "./package.json";

// Expo's config loader only transpiles this entry file; a plain `import` of a
// sibling `./config/*.ts` would fall through to Node's require, which can't load
// TypeScript. We load each variant through Expo's own per-file loader instead —
// it transpiles via tsc / Node's native type-stripping (never esbuild, which the
// F-Droid source scanner strips), and registers no global require hook. The
// `import type` above is erased at runtime and only supplies the shared shape.
type VariantConfig = typeof vvpConfig;

const loadVariant = (name: "volksverpetzer" | "mimikama"): VariantConfig =>
  loadModuleSync(path.join(__dirname, "config", `${name}.config.ts`)).default;

// Fallback auf "volksverpetzer", wenn process.env.APP nicht gesetzt ist
const appEnv = (process.env.APP ?? "volksverpetzer").toLowerCase();

const variableConfig = loadVariant(
  appEnv === "volksverpetzer" ? "volksverpetzer" : "mimikama",
);
const buildFossOnly = process.env.BUILD_FOSS_ONLY === "true";

const config = ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: variableConfig.appName,
    slug: variableConfig.slug,
    version: pkg.version,
    platforms: ["ios", "android", "web"],
    experiments: {
      typedRoutes: true,
    },
    orientation: "portrait",
    icon: variableConfig.assets.icon,
    scheme: "vvpapp",
    userInterfaceStyle: "automatic",
    plugins: [
      "./plugins/gradleproperties.plugin.ts",
      "@react-native-vector-icons/octicons",
      ["expo-router"],
      ["expo-asset"],
      ["expo-audio", { microphonePermission: false }],
      [
        "expo-sharing",
        {
          ios: {
            enabled: true,
            activationRule: {
              supportsText: true,
              supportsWebUrlWithMaxCount: 1,
              supportsWebPageWithMaxCount: 0,
            },
          },
          android: {
            enabled: true,
            singleShareMimeTypes: ["text/*"],
          },
        },
      ],
      ...(!buildFossOnly
        ? [
            [
              "@stripe/stripe-react-native",
              {
                merchantIdentifier:
                  variableConfig.extraConfig.donations.merchantIdentifier,
                enableGooglePay: false,
              },
            ] as [string, any],
            [
              "expo-notifications",
              {
                icon: variableConfig.assets.notificationIcon,
                color: variableConfig.extraConfig.themeColor,
              },
            ] as [string, any],
          ]
        : ["./plugins/withSplitAbi.plugin.ts" as const]),
      [
        "expo-custom-assets",
        {
          assetsPaths: ["./assets/rive"],
        },
      ],
      [
        "expo-splash-screen",
        {
          image: variableConfig.assets.splash,
          backgroundColor: variableConfig.extraConfig.themeColor,
        },
      ],
      "expo-font",
      "expo-image",
      "expo-mail-composer",
      "expo-web-browser",
    ],
    updates: {
      // Disable EAS updates for production builds
      enabled: false,
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/" + variableConfig.extraConfig.eas.projectId,
    },
    ios: {
      associatedDomains: variableConfig.iOSAssociatedDomains,
      infoPlist: {
        CFBundleLocalizations: ["de"],
        UIBackgroundModes: ["audio"],
        NSPhotoLibraryAddUsageDescription:
          "Damit du Bilder aus der App lokal speichern kannst.",
        NSCameraUsageDescription:
          "Wir benötigen die Kamera, um Bilder hochladen zu können.",
        LSApplicationQueriesSchemes: ["vvp"],
        RCTAsyncStorageExcludeFromBackup: false,
      },
      bundleIdentifier: variableConfig.packageName,
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      package: variableConfig.packageName,
      googleServicesFile: buildFossOnly
        ? undefined
        : variableConfig.googleServicesFile,
      allowBackup: true,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: variableConfig.AndroidIntentFilters,
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      blockedPermissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.ACTIVITY_RECOGNITION",
      ],
      permissions: ["WAKE_LOCK"],
      adaptiveIcon: {
        foregroundImage: variableConfig.assets.icon,
        monochromeImage: variableConfig.assets.iconMono,
        backgroundColor: "#ffffff",
      },
    },
    extra: {
      ...variableConfig.extraConfig,
      isFoss: buildFossOnly,
      ...(buildFossOnly && { enableAnalytics: false }),
    },
    ...(buildFossOnly && {
      autolinking: {
        android: {
          exclude: ["expo-notifications", "@stripe/stripe-react-native"],
        },
      },
    }),
    runtimeVersion: {
      policy: "sdkVersion",
    },
  };
};

export default config;
