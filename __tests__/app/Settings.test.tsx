import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useFocusEffect } from "expo-router";
import React, { useEffect } from "react";

import SettingsScreen from "#/app/(tabs)/settings";
import { popups } from "#/helpers/popups";
import { toast } from "#/helpers/toast";

import type { AsyncMock } from "#tests/mocks/jestTypes";

let mockIsFoss = false;
let mockEnableEngagement = false;
let mockEnableActions = true;
const mockRouterPush = jest.fn();

jest.mock("#/constants/Config", () => ({
  get isFoss() {
    return mockIsFoss;
  },
  get enableEngagement() {
    return mockEnableEngagement;
  },
  get enableActions() {
    return mockEnableActions;
  },
  aboutUrl: "https://example.com/about",
  donations: { support: "https://example.com/donate" },
  dataProtectionUrl: "https://example.com/datenschutz",
  imprintUrl: "https://example.com/imprint",
  sourceUrl: "https://example.com/source",
  wpUrl: "https://example.com",
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: mockRouterPush })),
  useFocusEffect: jest.fn(),
  router: { push: jest.fn() },
}));

jest.mock("expo-linking", () => ({
  openSettings: jest.fn(),
}));

jest.mock("expo-application", () => ({
  nativeApplicationVersion: "1.0.0",
  nativeBuildVersion: "42",
}));

jest.mock("#/helpers/Notifications", () => ({
  __esModule: true,
  default: {
    getToken: jest.fn(() => Promise.resolve("")),
    getPermissions: jest.fn(() => Promise.resolve({ status: "granted" })),
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
  InfoIcon: jest.fn(() => null),
  LockIcon: jest.fn(() => null),
  NotificationIcon: jest.fn(() => null),
  SearchIcon: jest.fn(() => null),
  SettingsIcon: jest.fn(() => null),
  ThemeIcon: jest.fn(() => null),
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
  },
}));
jest.mock("#/helpers/popups", () => ({
  popups: { confirm: jest.fn(() => Promise.resolve(true)), choose: jest.fn() },
}));
jest.mock("#/screens/Settings/components/BackupView", () => {
  const { Text } = require("react-native");
  return jest.fn(() => <Text>BackupView</Text>);
});
jest.mock("#/screens/Settings/components/ApiUrlSetting", () => {
  const { Text } = require("react-native");
  return jest.fn(() => <Text>ApiUrlSetting</Text>);
});
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" },
}));

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFoss = false;
    mockEnableEngagement = false;
    mockEnableActions = true;

    jest.spyOn(React, "useContext").mockReturnValue({
      contentSettings: {},
      setContentSettings: jest.fn(),
      advancedSettings: {},
      setAdvancedSettings: jest.fn(),
    });
    // Mirror the real useFocusEffect: run the (stable, []-memoized) callback
    // once on mount, same pattern used in MySources.test.tsx.
    jest.mocked(useFocusEffect).mockImplementation((cb) => {
      useEffect(() => cb(), [cb]);
    });
  });

  describe("notifications collapsable", () => {
    it("is visible when not FOSS", async () => {
      mockIsFoss = false;
      const { queryByText } = await render(<SettingsScreen />);
      expect(queryByText("Benachrichtigungen")).not.toBeNull();
    });

    it("is hidden when FOSS", async () => {
      mockIsFoss = true;
      const { queryByText } = await render(<SettingsScreen />);
      expect(queryByText("Benachrichtigungen")).toBeNull();
    });
  });

  describe("notification permission state", () => {
    const getNotificationListProps = () => {
      const SettingsList = jest.requireMock(
        "#/components/views/SettingsList",
      ) as jest.Mock;
      // Every re-render re-invokes the mock for all three SettingsList
      // usages (feed/notifications/advanced), so take the most recent
      // notifications call rather than the first (pre-permission-check) one.
      return SettingsList.mock.calls.findLast(
        (call: any[]) => "onDisabledPress" in call[0],
      )?.[0] as { disabled: boolean; onDisabledPress: () => void } | undefined;
    };

    it("disables the notification switches when permission is denied", async () => {
      const Notifications = jest.requireMock("#/helpers/Notifications") as {
        default: { getPermissions: jest.Mock<AsyncMock> };
      };
      Notifications.default.getPermissions.mockResolvedValue({
        status: "denied",
      });

      await render(<SettingsScreen />);

      await waitFor(() => {
        expect(getNotificationListProps()?.disabled).toBe(true);
      });
    });

    it("keeps the notification switches enabled when permission is granted", async () => {
      const Notifications = jest.requireMock("#/helpers/Notifications") as {
        default: { getPermissions: jest.Mock<AsyncMock> };
      };
      Notifications.default.getPermissions.mockResolvedValue({
        status: "granted",
      });

      await render(<SettingsScreen />);
      await waitFor(() => {
        expect(Notifications.default.getPermissions).toHaveBeenCalledTimes(1);
      });

      expect(getNotificationListProps()?.disabled).toBe(false);
    });

    it("opens system Settings when the disabled message is pressed", async () => {
      const Notifications = jest.requireMock("#/helpers/Notifications") as {
        default: { getPermissions: jest.Mock<AsyncMock> };
      };
      Notifications.default.getPermissions.mockResolvedValue({
        status: "denied",
      });
      const Linking = jest.requireMock("expo-linking") as {
        openSettings: jest.Mock;
      };

      await render(<SettingsScreen />);
      await waitFor(() => {
        expect(getNotificationListProps()?.disabled).toBe(true);
      });
      getNotificationListProps()?.onDisabledPress();

      expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    });

    it("disables the switches right away when the toggle's permission prompt is denied", async () => {
      // Undetermined at focus (iOS): the switches start enabled, toggling one
      // on shows the system prompt, and the user taps "Don't Allow".
      const Notifications = jest.requireMock("#/helpers/Notifications") as {
        default: {
          getPermissions: jest.Mock<AsyncMock>;
          registerForPushNotifications: jest.Mock<AsyncMock>;
        };
      };
      Notifications.default.getPermissions.mockResolvedValue({
        status: "undetermined",
      });
      Notifications.default.registerForPushNotifications.mockResolvedValueOnce({
        status: "denied",
        notificationSettings: {},
      });

      await render(<SettingsScreen />);
      await waitFor(() => {
        expect(Notifications.default.getPermissions).toHaveBeenCalledTimes(1);
      });
      expect(getNotificationListProps()?.disabled).toBe(false);

      const props = getNotificationListProps() as unknown as {
        saveSettings: (
          value: boolean,
          key: string,
          setting: { value: boolean },
        ) => Promise<void>;
      };
      await props.saveSettings(true, "new_post", { value: false });

      await waitFor(() => {
        expect(getNotificationListProps()?.disabled).toBe(true);
      });
      // No focus change needed: the permission check ran only once.
      expect(Notifications.default.getPermissions).toHaveBeenCalledTimes(1);
    });

    it("keeps the switches enabled when the toggle's registration succeeds", async () => {
      const Notifications = jest.requireMock("#/helpers/Notifications") as {
        default: {
          getPermissions: jest.Mock<AsyncMock>;
          registerForPushNotifications: jest.Mock<AsyncMock>;
        };
      };
      Notifications.default.getPermissions.mockResolvedValue({
        status: "undetermined",
      });
      Notifications.default.registerForPushNotifications.mockResolvedValueOnce({
        status: "ok",
        notificationSettings: {},
      });

      await render(<SettingsScreen />);
      await waitFor(() => {
        expect(Notifications.default.getPermissions).toHaveBeenCalledTimes(1);
      });

      const props = getNotificationListProps() as unknown as {
        saveSettings: (
          value: boolean,
          key: string,
          setting: { value: boolean },
        ) => Promise<void>;
      };
      await props.saveSettings(true, "new_post", { value: false });

      expect(
        Notifications.default.registerForPushNotifications,
      ).toHaveBeenCalledTimes(1);
      expect(getNotificationListProps()?.disabled).toBe(false);
    });

    it("does not check permissions in FOSS mode", async () => {
      mockIsFoss = true;
      const Notifications = jest.requireMock("#/helpers/Notifications") as {
        default: { getPermissions: jest.Mock<AsyncMock> };
      };

      await render(<SettingsScreen />);

      expect(Notifications.default.getPermissions).not.toHaveBeenCalled();
    });
  });

  describe("notification reset button", () => {
    it("is visible when not FOSS", async () => {
      mockIsFoss = false;
      const { queryByText } = await render(<SettingsScreen />);
      expect(queryByText("Benachrichtigungen zurücksetzen")).not.toBeNull();
    });

    it("is hidden when FOSS", async () => {
      mockIsFoss = true;
      const { queryByText } = await render(<SettingsScreen />);
      expect(queryByText("Benachrichtigungen zurücksetzen")).toBeNull();
    });
  });

  describe("notification reset button confirmation flow", () => {
    it("asks for confirmation in a dialog when pressed", async () => {
      const { getByText } = await render(<SettingsScreen />);
      await fireEvent.press(getByText("Benachrichtigungen zurücksetzen"));
      expect(jest.mocked(popups.confirm)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Benachrichtigungen zurücksetzen?",
          confirmLabel: "Zurücksetzen",
        }),
      );
    });

    it("does nothing when the dialog is cancelled", async () => {
      jest.mocked(popups.confirm).mockResolvedValueOnce(false);
      const { getByText } = await render(<SettingsScreen />);
      await fireEvent.press(getByText("Benachrichtigungen zurücksetzen"));
      await waitFor(() =>
        expect(jest.mocked(popups.confirm)).toHaveBeenCalled(),
      );
      expect(jest.mocked(toast.success)).not.toHaveBeenCalled();
    });

    it("calls registerForPushNotifications and shows success toast once confirmed", async () => {
      const Notifications = jest.requireMock("#/helpers/Notifications") as {
        default: { registerForPushNotifications: jest.Mock };
      };
      const { getByText } = await render(<SettingsScreen />);
      await fireEvent.press(getByText("Benachrichtigungen zurücksetzen"));
      await waitFor(() =>
        expect(
          Notifications.default.registerForPushNotifications,
        ).toHaveBeenCalled(),
      );
      expect(jest.mocked(toast.success)).toHaveBeenCalled();
    });
  });

  describe("achievements reset button", () => {
    it("is visible when actions are enabled", async () => {
      mockEnableActions = true;
      const { queryByText } = await render(<SettingsScreen />);
      expect(queryByText("Alle Erfolge zurücksetzen")).not.toBeNull();
    });

    it("is hidden when actions are disabled", async () => {
      mockEnableActions = false;
      const { queryByText } = await render(<SettingsScreen />);
      expect(queryByText("Alle Erfolge zurücksetzen")).toBeNull();
    });
  });

  describe("achievements reset button confirmation flow", () => {
    it("asks for confirmation in a dialog when pressed", async () => {
      const { getByText } = await render(<SettingsScreen />);
      await fireEvent.press(getByText("Alle Erfolge zurücksetzen"));
      expect(jest.mocked(popups.confirm)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Erfolge zurücksetzen?",
          confirmLabel: "Zurücksetzen",
        }),
      );
    });

    it("does nothing when the dialog is cancelled", async () => {
      jest.mocked(popups.confirm).mockResolvedValueOnce(false);
      const { getByText } = await render(<SettingsScreen />);
      await fireEvent.press(getByText("Alle Erfolge zurücksetzen"));
      await waitFor(() =>
        expect(jest.mocked(popups.confirm)).toHaveBeenCalled(),
      );
      expect(jest.mocked(toast.success)).not.toHaveBeenCalled();
    });

    it("resets achievements and shows success toast once confirmed", async () => {
      const { Achievements } = jest.requireMock("#/helpers/Achievements") as {
        Achievements: { resetEverything: jest.Mock };
      };
      const { getByText } = await render(<SettingsScreen />);
      await fireEvent.press(getByText("Alle Erfolge zurücksetzen"));
      await waitFor(() =>
        expect(Achievements.resetEverything).toHaveBeenCalled(),
      );
      expect(jest.mocked(toast.success)).toHaveBeenCalled();
    });
  });

  describe("intro reset button confirmation flow", () => {
    it("asks for confirmation in a dialog when pressed", async () => {
      const { getByText } = await render(<SettingsScreen />);
      await fireEvent.press(getByText("Intro zurücksetzen"));
      expect(jest.mocked(popups.confirm)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Intro zurücksetzen?",
          confirmLabel: "Zurücksetzen",
        }),
      );
    });

    it("does nothing when the dialog is cancelled", async () => {
      jest.mocked(popups.confirm).mockResolvedValueOnce(false);
      const { getByText } = await render(<SettingsScreen />);
      await fireEvent.press(getByText("Intro zurücksetzen"));
      await waitFor(() =>
        expect(jest.mocked(popups.confirm)).toHaveBeenCalled(),
      );
      expect(jest.mocked(toast.success)).not.toHaveBeenCalled();
    });

    it("resets onboarding state and shows success toast once confirmed", async () => {
      const mock = jest.requireMock("#/helpers/Stores/PersonalStore") as {
        default: {
          setOnboardingDone: jest.Mock;
          setLastSeenChangelogVersionCode: jest.Mock;
        };
      };
      const { getByText } = await render(<SettingsScreen />);
      await fireEvent.press(getByText("Intro zurücksetzen"));
      await waitFor(() =>
        expect(mock.default.setOnboardingDone).toHaveBeenCalledWith(false),
      );
      expect(mock.default.setLastSeenChangelogVersionCode).toHaveBeenCalledWith(
        0,
      );
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
        "Intro zurückgesetzt",
      );
    });
  });

  describe("backup (import/export)", () => {
    it("is visible when enableEngagement is true", async () => {
      mockEnableEngagement = true;
      const { queryByText } = await render(<SettingsScreen />);
      expect(queryByText("BackupView")).not.toBeNull();
    });

    it("is hidden when enableEngagement is false", async () => {
      mockEnableEngagement = false;
      const { queryByText } = await render(<SettingsScreen />);
      expect(queryByText("BackupView")).toBeNull();
    });
  });

  describe("version string", () => {
    afterEach(() => {
      mockIsFoss = false;
    });

    it("shows ' - FOSS' suffix when FOSS", async () => {
      mockIsFoss = true;
      const { queryByText } = await render(<SettingsScreen />);
      expect(queryByText(/ - FOSS/)).not.toBeNull();
    });

    it("does not show FOSS suffix when not FOSS", async () => {
      mockIsFoss = false;
      const { queryByText } = await render(<SettingsScreen />);
      expect(queryByText(/ - FOSS/)).toBeNull();
    });
  });

  describe("memory game easter egg", () => {
    it("does not navigate below the ten-tap threshold", async () => {
      const { getByText } = await render(<SettingsScreen />);
      const versionRow = getByText(/Versionskennung/);

      for (let tap = 0; tap < 9; tap++) {
        await fireEvent.press(versionRow);
      }

      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it("opens the memory game directly on the tenth tap and resets the counter", async () => {
      const { getByText } = await render(<SettingsScreen />);
      const versionRow = getByText(/Versionskennung/);

      for (let tap = 0; tap < 10; tap++) {
        await fireEvent.press(versionRow);
      }
      expect(mockRouterPush).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).toHaveBeenCalledWith("/game/DesinformationMemory");

      // Counter was reset on trigger, so a single extra tap shouldn't
      // navigate again.
      await fireEvent.press(versionRow);
      expect(mockRouterPush).toHaveBeenCalledTimes(1);
    });
  });
});
