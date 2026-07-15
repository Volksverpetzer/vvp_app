import { afterEach, jest } from "@jest/globals";
import * as mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import type { ReactNode } from "react";
import { Platform } from "react-native";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("react-native/Libraries/Interaction/InteractionManager", () => ({
  createInteractionHandle: jest.fn(),
  runAfterInteractions: jest.fn(),
  setDeadline: jest.fn(),
  clearInteractionHandle: jest.fn(),
}));

jest.mock("@react-native-vector-icons/octicons/static", () => ({
  default: jest.fn(),
  __esModule: true,
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        enableActions: true,
        enableAnalytics: true,
        enableEngagement: true,
        wpUrl: "https://www.volksverpetzer.de",
        feeds: {
          wp: [
            {
              handle: "https://www.volksverpetzer.de",
              label: "Artikel",
              enabled: true,
            },
            {
              handle: "https://www.pruefpunkt.org",
              label: "Prüfpunkt Artikel",
              sourceName: "Prüfpunkt",
              enabled: true,
            },
          ],
          insta: [
            {
              handle: "volksverpetzer",
              label: "Instagram Slides",
              enabled: true,
            },
            {
              handle: "pruefpunkt",
              label: "Prüfpunkt Instagram",
              enabled: true,
            },
          ],
          yt: { enabled: true },
          bsky: { handle: "volksverpetzer.de", enabled: true },
        },
        colorScheme: {
          light: {
            text: "#111",
            background: "#fff",
            surface: "#E2F0F5",
            surfaceInput: "#BADDE8",
            surfaceDisabled: "#bbb",
            textMuted: "#aaa",
            onPrimary: "#3893C0",
            accent: "#DB2685",
            primary: "#1b7194",
            primaryMuted: "#3893C0",
          },
          dark: {
            text: "#111",
            background: "#fff",
            surface: "#E2F0F5",
            surfaceInput: "#BADDE8",
            surfaceDisabled: "#bbb",
            textMuted: "#aaa",
            onPrimary: "#3893C0",
            accent: "#DB2685",
            primary: "#1b7194",
            primaryMuted: "#3893C0",
          },
        },
      },
    },
  },
}));

jest.mock("expo-router", () => {
  const Tabs = ({ children }: { children: ReactNode }) => children;
  Tabs.Screen = jest.fn(() => null);

  return {
    __esModule: true,
    Tabs,
    useFocusEffect: jest.fn(),
  };
});

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("react-native-safe-area-context", () => {
  // The bundled mock only exposes a default export; surface its members as
  // named exports too so `import { useSafeAreaInsets }` resolves.
  const mock = require("react-native-safe-area-context/jest/mock").default;
  return { __esModule: true, default: mock, ...mock };
});

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  AndroidImportance: {
    HIGH: 4,
    DEFAULT: 3,
  },
}));

jest.mock("expo-device", () => ({
  isDevice: true,
}));

jest.mock("expo-web-browser", () => ({
  __esModule: true,
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: "opened" })),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
  useCorporateColor: jest.fn(() => "#1b7194"),
  ColorScheme: { light: "light", dark: "dark" },
}));

jest.mock("expo-application", () => ({
  nativeBuildVersion: "1.0.0",
}));

jest.mock("expo/fetch", () => ({
  fetch: (...args: unknown[]) => (globalThis as any).fetch(...args),
}));

const originalPlatform = Platform.OS;

afterEach(() => {
  Object.defineProperty(Platform, "OS", {
    value: originalPlatform,
    configurable: true,
  });
});
