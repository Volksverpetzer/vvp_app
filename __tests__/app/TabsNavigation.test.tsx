import { render } from "@testing-library/react-native";
import { Platform } from "react-native";

import TabLayout from "#/app/(tabs)/_layout";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { useBadge } from "#/helpers/provider/BadgeProvider";
import { ColorScheme, useAppColorScheme } from "#/hooks/useAppColorScheme";

jest.mock("@react-native-vector-icons/lucide/static", () => ({
  default: jest.fn(() => null),
  __esModule: true,
}));

jest.mock("expo-router/unstable-native-tabs", () => ({
  NativeTabs: Object.assign(
    jest.fn(({ children }) => children),
    {
      Trigger: Object.assign(
        jest.fn(({ children }) => children),
        {
          Icon: jest.fn(() => null),
          Label: jest.fn(() => null),
          Badge: jest.fn(() => null),
          VectorIcon: jest.fn(() => null),
        },
      ),
    },
  ),
}));

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  useBadge: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { enableActions: true, enableEngagement: true },
}));

describe("TabsNavigation", () => {
  const { NativeTabs } = jest.requireMock("expo-router/unstable-native-tabs");

  const getPersonalTriggerProps = (): { hidden?: boolean } | undefined => {
    const call = (NativeTabs.Trigger as jest.Mock).mock.calls.find(
      ([props]: [{ name?: string }]) => props?.name === "personal",
    );
    return call?.[0];
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useBadge as jest.Mock).mockReturnValue({
      badgeState: { personal: false, action: false },
    });
    (useAppColorScheme as jest.Mock).mockReturnValue(ColorScheme.light);
    Config.enableEngagement = true;
  });

  it("should hide personal tab when favorites are disabled", async () => {
    Config.enableEngagement = false;
    await render(<TabLayout />);
    expect(getPersonalTriggerProps()?.hidden).toBe(true);
  });

  it("should show personal tab when favorites are enabled", async () => {
    Config.enableEngagement = true;
    await render(<TabLayout />);
    expect(getPersonalTriggerProps()?.hidden).toBe(false);
  });

  it.each([ColorScheme.light, ColorScheme.dark])(
    "should pass the %s corporate tint to the native tab bar",
    async (scheme) => {
      (useAppColorScheme as jest.Mock).mockReturnValue(scheme);
      await render(<TabLayout />);
      const props = (NativeTabs as jest.Mock).mock.calls.at(-1)?.[0];
      expect(props.tintColor).toBe(Colors[scheme].primary);
    },
  );

  describe.each([ColorScheme.light, ColorScheme.dark])(
    "selected icon color in %s mode",
    (scheme) => {
      let platform: jest.ReplaceProperty<typeof Platform.OS> | undefined;

      beforeEach(() => {
        (useAppColorScheme as jest.Mock).mockReturnValue(scheme);
      });

      afterEach(() => {
        platform?.restore();
        platform = undefined;
      });

      const renderOn = async (os: typeof Platform.OS) => {
        platform = jest.replaceProperty(Platform, "OS", os);
        await render(<TabLayout />);
        return (NativeTabs as jest.Mock).mock.calls.at(-1)?.[0].iconColor;
      };

      it("uses the corporate color on iOS, where the system draws a light pill", async () => {
        const iconColor = await renderOn("ios");
        expect(iconColor.selected).toBe(Colors[scheme].primary);
        expect(iconColor.selected).not.toBe(Colors[scheme].onPrimary);
      });

      it("uses on-primary on Android, on top of the corporate indicator", async () => {
        const iconColor = await renderOn("android");
        expect(iconColor.selected).toBe(Colors[scheme].onPrimary);
      });
    },
  );
});
