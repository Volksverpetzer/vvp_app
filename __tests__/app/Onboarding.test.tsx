import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
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

// Capture data and onFinish from FlatBoard without rendering the full UI
let capturedData: { id: number; title: string }[] = [];
let capturedOnFinish: (() => Promise<void>) | null = null;

jest.mock("#/screens/Onboarding/components/Flatboard", () => ({
  __esModule: true,
  default: jest.fn(({ data, onFinish }: any) => {
    capturedData = data;
    capturedOnFinish = onFinish;
    return null;
  }),
}));

jest.mock("#/helpers/Notifications", () => ({
  __esModule: true,
  default: {
    registerForPushNotifications: jest.fn(() => Promise.resolve({})),
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

jest.mock("#/helpers/Stores/SettingsStore", () => ({
  __esModule: true,
  default: {
    defaultNotificationSettings: {
      new_post: { value: true, name: "Neue Artikel" },
    },
  },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
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
jest.mock("#/components/design/View", () =>
  jest.fn(({ children }: any) => children),
);
jest.mock("#/components/views/SettingsList", () => jest.fn(() => null));
jest.mock("#/constants/Colors", () => ({ light: { heading: "#333" } }));
jest.mock("#/constants/Styles", () => ({ styles: { heading: {} } }));
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
    jest.spyOn(React, "useContext").mockReturnValue({
      contentSettings: {},
      setContentSettings: jest.fn(),
    });
  });

  describe("notification step visibility", () => {
    it("includes the notifications step when IS_FOSS is false", () => {
      mockIsFoss = false;
      render(<Onboarding />);

      const ids = capturedData.map((s) => s.id);
      expect(ids).toContain(NOTIFICATION_STEP_ID);
    });

    it("excludes the notifications step when IS_FOSS is true", () => {
      mockIsFoss = true;
      render(<Onboarding />);

      const ids = capturedData.map((s) => s.id);
      expect(ids).not.toContain(NOTIFICATION_STEP_ID);
    });

    it("keeps all other steps when IS_FOSS is true", () => {
      mockIsFoss = true;
      render(<Onboarding />);

      const ids = capturedData.map((s) => s.id);
      expect(ids).toContain(1); // Welcome
      expect(ids).toContain(3); // Content settings
      expect(ids).toContain(8); // Privacy
    });
  });

  describe("agreeToTerms (onFinish callback)", () => {
    it("calls registerForPushNotifications when IS_FOSS is false", async () => {
      mockIsFoss = false;
      render(<Onboarding />);

      await capturedOnFinish!();

      expect(Notifications.registerForPushNotifications).toHaveBeenCalledTimes(
        1,
      );
      expect(PersonalStore.setOnboardingDone).toHaveBeenCalledTimes(1);
    });

    it("skips registerForPushNotifications when IS_FOSS is true", async () => {
      mockIsFoss = true;
      render(<Onboarding />);

      await capturedOnFinish!();

      expect(Notifications.registerForPushNotifications).not.toHaveBeenCalled();
      expect(PersonalStore.setOnboardingDone).toHaveBeenCalledTimes(1);
    });

    it("still completes onboarding when IS_FOSS is true", async () => {
      mockIsFoss = true;
      render(<Onboarding />);

      await capturedOnFinish!();

      expect(PersonalStore.setOnboardingDone).toHaveBeenCalledTimes(1);
      expect(updateBadgeState).toHaveBeenCalledWith({
        personal: false,
        action: true,
      });
    });
  });
});
