import { afterEach, jest } from "@jest/globals";
import type { ReactNode } from "react";
import { Platform } from "react-native";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("react-native/Libraries/Interaction/InteractionManager", () => ({
  createInteractionHandle: jest.fn(),
  runAfterInteractions: jest.fn(),
  setDeadline: jest.fn(),
  clearInteractionHandle: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: jest.fn(),
  Ionicons: jest.fn(),
  FontAwesome: jest.fn(),
  MaterialIcons: jest.fn(),
  Entypo: jest.fn(),
  Feather: jest.fn(),
  AntDesign: jest.fn(),
  Fontisto: jest.fn(),
  EvilIcons: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        enableActions: true,
        enableAnalytics: true,
        enableEngagement: true,
        colorScheme: {
          light: {
            text: "#111",
            heading: "#1B7194",
            background: "#fff",
            secondaryBackground: "#E2F0F5",
            tint: "#3893C0",
            tabIconDefault: "#aaa",
            grayedOut: "#bbb",
            grayedOutText: "#aaa",
            tabIconSelected: "#3893C0",
            inputBackground: "#BADDE8",
            highlight: "#DB2685",
            corporate: "#1b7194",
          },
          dark: {
            text: "#111",
            heading: "#1B7194",
            background: "#fff",
            secondaryBackground: "#E2F0F5",
            tint: "#3893C0",
            tabIconDefault: "#aaa",
            grayedOut: "#bbb",
            grayedOutText: "#aaa",
            tabIconSelected: "#3893C0",
            inputBackground: "#BADDE8",
            highlight: "#DB2685",
            corporate: "#1b7194",
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

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

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

jest.mock("expo-application", () => ({
  nativeBuildVersion: "1.0.0",
}));

const originalPlatform = Platform.OS;

afterEach(() => {
  Object.defineProperty(Platform, "OS", {
    value: originalPlatform,
    configurable: true,
  });
});
