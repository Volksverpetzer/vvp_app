import type { ConfigContext, ExpoConfig } from "@expo/config";
import "ts-node/register";
import "tsx/cjs";

import mimikamaConfig from "./config/mimikama.config";
import vvpConfig from "./config/volksverpetzer.config";
import * as pkg from "./package.json";

// Fallback auf "volksverpetzer", wenn process.env.APP nicht gesetzt ist
const appEnv = (process.env.APP ?? "volksverpetzer").toLowerCase();

const variableConfig = appEnv === "volksverpetzer" ? vvpConfig : mimikamaConfig;

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
      ["expo-router"],
      ["expo-asset"],
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier:
            variableConfig.extraConfig.donations.merchantIdentifier,
          enableGooglePay: false,
        },
      ],
      [
        "expo-notifications",
        {
          icon: variableConfig.assets.notificationIcon,
          color: variableConfig.extraConfig.themeColor,
        },
      ],
      [
        "expo-custom-assets",
        {
          assetsPaths: ["./assets/rive"],
        },
      ],
      "expo-font",
      "expo-mail-composer",
      "expo-web-browser",
    ],
    splash: {
      image: variableConfig.assets.splash,
      backgroundColor: variableConfig.extraConfig.themeColor,
    },
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
      googleServicesFile: variableConfig.googleServicesFile,
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
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
  };
};

export default config;
