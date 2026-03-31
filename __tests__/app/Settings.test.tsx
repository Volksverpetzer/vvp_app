import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";

import SettingsScreen from "#/app/(tabs)/settings";

let mockIsFoss = false;

jest.mock("#/constants/Config", () => ({
  get isFoss() {
    return mockIsFoss;
  },
  aboutUrl: "https://example.com/about",
  donations: { support: "https://example.com/donate" },
  dataProtectionUrl: "https://example.com/datenschutz",
  sourceUrl: "https://example.com/source",
  wpUrl: "https://example.com",
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  router: { push: jest.fn() },
}));

jest.mock("expo-application", () => ({
  nativeApplicationVersion: "1.0.0",
  nativeBuildVersion: "42",
}));

jest.mock("#/helpers/Notifications", () => ({
  __esModule: true,
  default: {
    getToken: jest.fn().mockResolvedValue("test-token"),
    registerForPushNotifications: jest.fn().mockResolvedValue({
      notificationSettings: {},
    }),
  },
}));

jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: { setOnboardingDone: jest.fn() },
}));

jest.mock("#/helpers/Stores/SettingsStore", () => ({
  __esModule: true,
  default: {
    defaultNotificationSettings: {},
    getNotificationSettings: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock("#/helpers/provider/SettingsProvider", () => ({
  SettingsContext: { _currentValue: {} },
}));

jest.mock("#/helpers/Achievements", () => ({
  Achievements: { resetEverything: jest.fn() },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  light: {
    corporate: "#e63312",
    background: "#fff",
    secondaryBackground: "#f5f5f5",
  },
}));

jest.mock("#/constants/Styles", () => ({ styles: { heading: {} } }));

// Mock all heavy UI components
jest.mock("#/components/animations/AnimatedHeader", () => jest.fn(() => null));
jest.mock("#/components/design/Collapsable", () => {
  const { Text } = require("react-native");
  return jest.fn(({ title, children }: any) => (
    <>
      <Text>{title}</Text>
      {children}
    </>
  ));
});
jest.mock("#/components/design/DesignedLink", () => jest.fn(() => null));
jest.mock("#/components/design/Divider", () => jest.fn(() => null));
jest.mock("#/components/design/Space", () => jest.fn(() => null));
jest.mock("#/components/design/Text", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});
jest.mock("#/components/views/Donate", () => jest.fn(() => null));
jest.mock("#/components/views/SettingsList", () => jest.fn(() => null));
jest.mock("#/components/buttons/ShopButton", () => jest.fn(() => null));
jest.mock("#/components/Icons", () => ({
  CodeIcon: jest.fn(() => null),
  FeedIcon: jest.fn(() => null),
  FeedbackIcon: jest.fn(() => null),
  GiveIcon: jest.fn(() => null),
  LockIcon: jest.fn(() => null),
  NotificationIcon: jest.fn(() => null),
  SearchIcon: jest.fn(() => null),
  SettingsIcon: jest.fn(() => null),
}));
jest.mock("react-native-gesture-handler", () => ({
  ScrollView: jest.fn(({ children }: any) => children),
}));
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(React, "useContext").mockReturnValue({
      contentSettings: {},
      setContentSettings: jest.fn(),
      advancedSettings: {},
      setAdvancedSettings: jest.fn(),
    });
  });

  describe("notifications collapsable", () => {
    it("is visible when not FOSS", () => {
      mockIsFoss = false;
      const { queryByText } = render(<SettingsScreen />);
      expect(queryByText("Benachrichtigungen")).not.toBeNull();
    });

    it("is hidden when FOSS", () => {
      mockIsFoss = true;
      const { queryByText } = render(<SettingsScreen />);
      expect(queryByText("Benachrichtigungen")).toBeNull();
    });
  });

  describe("notification reset button", () => {
    it("is visible when not FOSS", () => {
      mockIsFoss = false;
      const { queryByText } = render(<SettingsScreen />);
      expect(queryByText("Benachrichtigungen zurücksetzen")).not.toBeNull();
    });

    it("is hidden when FOSS", () => {
      mockIsFoss = true;
      const { queryByText } = render(<SettingsScreen />);
      expect(queryByText("Benachrichtigungen zurücksetzen")).toBeNull();
    });
  });

  describe("version string", () => {
    afterEach(() => {
      mockIsFoss = false;
    });

    it("shows ' - FOSS' suffix when FOSS", () => {
      mockIsFoss = true;
      const { queryByText } = render(<SettingsScreen />);
      expect(queryByText(/ - FOSS/)).not.toBeNull();
    });

    it("does not show FOSS suffix when not FOSS", () => {
      mockIsFoss = false;
      const { queryByText } = render(<SettingsScreen />);
      expect(queryByText(/ - FOSS/)).toBeNull();
    });
  });
});
