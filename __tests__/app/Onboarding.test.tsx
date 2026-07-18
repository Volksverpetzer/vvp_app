import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render } from "@testing-library/react-native";
import React from "react";

import Onboarding from "#/app/onboarding";
import Notifications from "#/helpers/Notifications";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";

// Controlled isFoss flag — changed per test
let mockIsFoss = false;

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      name: "TestApp",
      extra: {
        dataProtectionUrl: "https://example.com/datenschutz",
      },
    },
  },
}));

jest.mock("#/constants/Config", () => ({
  get isFoss() {
    return mockIsFoss;
  },
  dataProtectionUrl: "https://example.com/datenschutz",
}));

// Capture data, onFinish and onStepChange from FlatBoard without rendering the full UI
let capturedData: { id: number; title: string }[] = [];
let capturedOnFinish: (() => Promise<void>) | null = null;
let capturedOnStepChange: ((item: any, step: number) => void) | null = null;

jest.mock("#/screens/Onboarding/components/Flatboard", () => ({
  __esModule: true,
  default: jest.fn(({ data, onFinish, onStepChange }: any) => {
    capturedData = data;
    capturedOnFinish = onFinish;
    capturedOnStepChange = onStepChange;
    return null;
  }),
}));

jest.mock("#/helpers/Notifications", () => ({
  __esModule: true,
  default: {
    registerForPushNotifications: jest.fn(() => Promise.resolve({})),
    requestPermissionAndApplyDefaults: jest.fn(() =>
      Promise.resolve({ status: "granted", notificationSettings: {} }),
    ),
    getPermissions: jest.fn(() =>
      Promise.resolve({ status: "granted", granted: true }),
    ),
  },
}));

jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    setOnboardingDone: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  updateBadgeState: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock("expo-linking", () => ({
  openSettings: jest.fn(),
}));

jest.mock("#/helpers/Stores/SettingsStore", () => ({
  __esModule: true,
  default: {
    defaultNotificationSettings: {
      new_post: { value: true, name: "Neue Artikel" },
    },
  },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
  useCorporateColor: jest.fn(() => "#e63312"),
}));

jest.mock("#/helpers/utils/variant", () => ({
  isVolksverpetzer: false,
}));

jest.mock("#/components/Icons", () => ({
  FeedIcon: jest.fn(() => null),
  NotificationIcon: jest.fn(() => null),
  SafetyIcon: jest.fn(() => null),
}));

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});
jest.mock("#/components/views/SettingsList", () => jest.fn(() => null));
jest.mock("#/constants/Colors", () => ({
  light: { primary: "#333", background: "#fff" },
}));
jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { heading: {}, centered: {}, whiteText: {}, content: {} },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(() => ({ bottom: 0 })),
}));
jest.mock("#/helpers/provider/SettingsProvider", () => ({
  SettingsContext: { _currentValue: {} },
}));

const NOTIFICATION_STEP_ID = 7;

describe("Onboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedData = [];
    capturedOnFinish = null;
    capturedOnStepChange = null;
    jest.spyOn(React, "useContext").mockReturnValue({
      contentSettings: {},
      setContentSettings: jest.fn(),
    });
  });

  describe("notification step visibility", () => {
    it("includes the notifications step when IS_FOSS is false", async () => {
      mockIsFoss = false;
      await render(<Onboarding />);

      const ids = capturedData.map((s) => s.id);
      expect(ids).toContain(NOTIFICATION_STEP_ID);
    });

    it("excludes the notifications step when IS_FOSS is true", async () => {
      mockIsFoss = true;
      await render(<Onboarding />);

      const ids = capturedData.map((s) => s.id);
      expect(ids).not.toContain(NOTIFICATION_STEP_ID);
    });

    it("keeps all other steps when IS_FOSS is true", async () => {
      mockIsFoss = true;
      await render(<Onboarding />);

      const ids = capturedData.map((s) => s.id);
      expect(ids).toContain(1); // Welcome
      expect(ids).toContain(3); // Content settings
      expect(ids).toContain(8); // Privacy
    });
  });

  describe("onStepChange (notification permission request)", () => {
    it("requests notification permission once the notification step is reached", async () => {
      mockIsFoss = false;
      await render(<Onboarding />);

      await act(async () => {
        capturedOnStepChange!(
          { id: NOTIFICATION_STEP_ID },
          capturedData.findIndex((s) => s.id === NOTIFICATION_STEP_ID),
        );
        await Promise.resolve();
      });

      expect(
        Notifications.requestPermissionAndApplyDefaults,
      ).toHaveBeenCalledTimes(1);
    });

    it("does not request permission for other steps", async () => {
      mockIsFoss = false;
      await render(<Onboarding />);

      await act(async () => {
        capturedOnStepChange!({ id: 1 }, 0);
        capturedOnStepChange!({ id: 8 }, 2);
        await Promise.resolve();
      });

      expect(
        Notifications.requestPermissionAndApplyDefaults,
      ).not.toHaveBeenCalled();
    });

    it("only requests permission once even if the step is revisited", async () => {
      mockIsFoss = false;
      await render(<Onboarding />);

      await act(async () => {
        capturedOnStepChange!({ id: NOTIFICATION_STEP_ID }, 2);
        capturedOnStepChange!({ id: 1 }, 0);
        capturedOnStepChange!({ id: NOTIFICATION_STEP_ID }, 2);
        await Promise.resolve();
      });

      expect(
        Notifications.requestPermissionAndApplyDefaults,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("notification switches disabled state", () => {
    // FlatBoard is mocked to just capture `data` without rendering any step's
    // Component, so we render the notification step's Component ourselves to
    // see what it passes down to SettingsList.
    const renderNotificationStepAndGetListProps = async () => {
      const notificationStep = (capturedData as any[]).find(
        (s) => s.id === NOTIFICATION_STEP_ID,
      );
      const NotificationStepComponent = notificationStep.Component;
      await render(<NotificationStepComponent />);
      const SettingsList = jest.requireMock(
        "#/components/views/SettingsList",
      ) as jest.Mock;
      return SettingsList.mock.calls.at(-1)?.[0] as
        { disabled: boolean; onDisabledPress: () => void } | undefined;
    };

    it("disables the switches and offers Settings when permission is denied", async () => {
      mockIsFoss = false;
      jest
        .mocked(Notifications.requestPermissionAndApplyDefaults)
        .mockResolvedValue({
          status: "denied",
          notificationSettings: {
            new_post: { value: false, name: "Neue Artikel" },
          },
        } as any);
      await render(<Onboarding />);

      await act(async () => {
        capturedOnStepChange!(
          { id: NOTIFICATION_STEP_ID },
          capturedData.findIndex((s) => s.id === NOTIFICATION_STEP_ID),
        );
        await Promise.resolve();
      });

      const listProps = await renderNotificationStepAndGetListProps();
      expect(listProps?.disabled).toBe(true);

      const Linking = jest.requireMock("expo-linking") as {
        openSettings: jest.Mock;
      };
      listProps?.onDisabledPress();
      expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    });

    it("keeps the switches enabled when permission is granted", async () => {
      mockIsFoss = false;
      jest
        .mocked(Notifications.requestPermissionAndApplyDefaults)
        .mockResolvedValue({
          status: "ok",
          notificationSettings: {
            new_post: { value: true, name: "Neue Artikel" },
          },
        } as any);
      await render(<Onboarding />);

      await act(async () => {
        capturedOnStepChange!(
          { id: NOTIFICATION_STEP_ID },
          capturedData.findIndex((s) => s.id === NOTIFICATION_STEP_ID),
        );
        await Promise.resolve();
      });

      const listProps = await renderNotificationStepAndGetListProps();
      expect(listProps?.disabled).toBe(false);
    });
  });

  describe("agreeToTerms (onFinish callback)", () => {
    it("calls registerForPushNotifications when IS_FOSS is false", async () => {
      mockIsFoss = false;
      await render(<Onboarding />);

      await capturedOnFinish!();

      expect(Notifications.registerForPushNotifications).toHaveBeenCalledTimes(
        1,
      );
      expect(PersonalStore.setOnboardingDone).toHaveBeenCalledTimes(1);
    });

    it("skips registerForPushNotifications when permission is not granted", async () => {
      mockIsFoss = false;
      (Notifications.getPermissions as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({ status: "denied", granted: false }),
      );
      await render(<Onboarding />);

      await capturedOnFinish!();

      // Registering would call requestPermissionsAsync again and show a
      // second OS dialog right after the user denied on the step.
      expect(Notifications.registerForPushNotifications).not.toHaveBeenCalled();
      expect(PersonalStore.setOnboardingDone).toHaveBeenCalledTimes(1);
    });

    it("skips registerForPushNotifications when IS_FOSS is true", async () => {
      mockIsFoss = true;
      await render(<Onboarding />);

      await capturedOnFinish!();

      expect(Notifications.registerForPushNotifications).not.toHaveBeenCalled();
      expect(PersonalStore.setOnboardingDone).toHaveBeenCalledTimes(1);
    });

    it("still completes onboarding when IS_FOSS is true", async () => {
      mockIsFoss = true;
      await render(<Onboarding />);

      await capturedOnFinish!();

      expect(PersonalStore.setOnboardingDone).toHaveBeenCalledTimes(1);
      expect(updateBadgeState).toHaveBeenCalledWith({
        personal: false,
        action: true,
      });
    });
  });
});
