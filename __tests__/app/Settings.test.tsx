import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import SettingsScreen from "#/app/(tabs)/settings";
import { toast } from "#/helpers/toast";

let mockIsFoss = false;
let mockEnableEngagement = false;

jest.mock("#/constants/Config", () => ({
  get isFoss() {
    return mockIsFoss;
  },
  get enableEngagement() {
    return mockEnableEngagement;
  },
  aboutUrl: "https://example.com/about",
  donations: { support: "https://example.com/donate" },
  dataProtectionUrl: "https://example.com/datenschutz",
  imprintUrl: "https://example.com/imprint",
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
    getToken: jest.fn(() => Promise.resolve("")),
    registerForPushNotifications: jest.fn(() =>
      Promise.resolve({ notificationSettings: {} }),
    ),
  },
}));

jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    setOnboardingDone: jest.fn(),
    setLastSeenChangelogVersionCode: jest.fn(),
  },
}));

jest.mock("#/helpers/Stores/SettingsStore", () => ({
  __esModule: true,
  default: {
    defaultNotificationSettings: {},
    getNotificationSettings: jest.fn(() => Promise.resolve({})),
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
    primary: "#e63312",
    background: "#fff",
    surface: "#f5f5f5",
  },
}));

jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { heading: {}, content: {} },
}));

// Mock all heavy UI components
jest.mock("#/components/animations/AnimatedHeader", () => jest.fn(() => null));
jest.mock("#/components/ui/UiCollapsable", () => {
  const { Text } = require("react-native");
  return jest.fn(({ title, children }: any) => (
    <>
      <Text>{title}</Text>
      {children}
    </>
  ));
});
jest.mock("#/components/ui/UiLink", () => jest.fn(() => null));
jest.mock("#/components/ui/UiDivider", () => jest.fn(() => null));
jest.mock("#/components/ui/UiSpace", () => jest.fn(() => null));
jest.mock("#/components/ui/UiText", () => {
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
  DownloadIcon: jest.fn(() => null),
  FeedIcon: jest.fn(() => null),
  FeedbackIcon: jest.fn(() => null),
  GiveIcon: jest.fn(() => null),
  ImprintIcon: jest.fn(() => null),
  LockIcon: jest.fn(() => null),
  NotificationIcon: jest.fn(() => null),
  SearchIcon: jest.fn(() => null),
  SettingsIcon: jest.fn(() => null),
  UploadIcon: jest.fn(() => null),
}));
jest.mock("react-native-gesture-handler", () => ({
  ScrollView: jest.fn(({ children }: any) => children),
}));
jest.mock("#/helpers/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    confirm: jest.fn(),
  },
}));
jest.mock("#/screens/Settings/components/BackupView", () => {
  const { Text } = require("react-native");
  return jest.fn(() => <Text>BackupView</Text>);
});

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFoss = false;
    mockEnableEngagement = false;

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

  describe("notification reset button confirmation flow", () => {
    it("shows a confirm toast when pressed", () => {
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText("Benachrichtigungen zurücksetzen"));
      expect(jest.mocked(toast.confirm)).toHaveBeenCalledWith(
        "Benachrichtigungen zurücksetzen?",
        expect.any(String),
        expect.any(Function),
      );
    });

    it("calls registerForPushNotifications and shows success toast on confirm", () => {
      const Notifications = jest.requireMock("#/helpers/Notifications") as {
        default: { registerForPushNotifications: jest.Mock };
      };
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText("Benachrichtigungen zurücksetzen"));
      const onConfirm = jest.mocked(toast.confirm).mock.calls[0][2];
      onConfirm();
      expect(
        Notifications.default.registerForPushNotifications,
      ).toHaveBeenCalled();
      expect(jest.mocked(toast.success)).toHaveBeenCalled();
    });
  });

  describe("achievements reset button confirmation flow", () => {
    it("shows a confirm toast when pressed", () => {
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText("Alle Erfolge zurücksetzen"));
      expect(jest.mocked(toast.confirm)).toHaveBeenCalledWith(
        "Erfolge zurücksetzen?",
        expect.any(String),
        expect.any(Function),
      );
    });

    it("resets achievements and shows success toast on confirm", () => {
      const { Achievements } = jest.requireMock("#/helpers/Achievements") as {
        Achievements: { resetEverything: jest.Mock };
      };
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText("Alle Erfolge zurücksetzen"));
      const onConfirm = jest.mocked(toast.confirm).mock.calls[0][2];
      onConfirm();
      expect(Achievements.resetEverything).toHaveBeenCalled();
      expect(jest.mocked(toast.success)).toHaveBeenCalled();
    });
  });

  describe("intro reset button confirmation flow", () => {
    it("shows a confirm toast when pressed", () => {
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText("Intro zurücksetzen"));
      expect(jest.mocked(toast.confirm)).toHaveBeenCalledWith(
        "Intro zurücksetzen?",
        "Intro erscheint beim nächsten Start erneut",
        expect.any(Function),
      );
    });

    it("resets onboarding state and shows success toast on confirm", () => {
      const mock = jest.requireMock("#/helpers/Stores/PersonalStore") as {
        default: {
          setOnboardingDone: jest.Mock;
          setLastSeenChangelogVersionCode: jest.Mock;
        };
      };
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText("Intro zurücksetzen"));
      const onConfirm = jest.mocked(toast.confirm).mock.calls[0][2];
      onConfirm();
      expect(mock.default.setOnboardingDone).toHaveBeenCalledWith(false);
      expect(mock.default.setLastSeenChangelogVersionCode).toHaveBeenCalledWith(
        0,
      );
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
        "Intro zurückgesetzt",
        "Beim nächsten App-Start wird das Intro angezeigt",
      );
    });
  });

  describe("backup (import/export)", () => {
    it("is visible when enableEngagement is true", () => {
      mockEnableEngagement = true;
      const { queryByText } = render(<SettingsScreen />);
      expect(queryByText("BackupView")).not.toBeNull();
    });

    it("is hidden when enableEngagement is false", () => {
      mockEnableEngagement = false;
      const { queryByText } = render(<SettingsScreen />);
      expect(queryByText("BackupView")).toBeNull();
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
