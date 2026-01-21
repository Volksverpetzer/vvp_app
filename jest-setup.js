import { afterEach, jest } from "@jest/globals";
import { Platform } from "react-native";

// Set React Act environment flag for React 19
global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("react-native/Libraries/Interaction/InteractionManager", () => ({
  createInteractionHandle: jest.fn(),
  runAfterInteractions: jest.fn(),
  setDeadline: jest.fn(),
  // Add other methods if needed
  clearInteractionHandle: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => {
  return {
    MaterialCommunityIcons: jest.fn(),
    Ionicons: jest.fn(),
    FontAwesome: jest.fn(),
    MaterialIcons: jest.fn(),
    Entypo: jest.fn(),
    Feather: jest.fn(),
    AntDesign: jest.fn(),
    Fontisto: jest.fn(),
    EvilIcons: jest.fn(),
  };
});

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
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

jest.mock("expo-router", () => ({
  __esModule: true,
  useFocusEffect: jest.fn(),
}));

// Mock AsyncStorage for tests
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock expo-notifications
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

// Mock expo-device
jest.mock("expo-device", () => ({
  isDevice: true,
}));

// Mock expo-application
jest.mock("expo-application", () => ({
  nativeBuildVersion: "1.0.0",
}));

// Mock Platform.OS
const originalPlatform = Platform.OS;

afterEach(() => {
  // Reset the Platform.OS to its original value after each test
  Object.defineProperty(Platform, "OS", {
    value: originalPlatform,
    configurable: true,
  });
});
