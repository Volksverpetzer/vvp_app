import { render } from "@testing-library/react-native";

import TabLayout from "#/app/(tabs)/_layout";
import Config from "#/constants/Config";
import { useBadge } from "#/helpers/provider/BadgeProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

jest.mock("@expo/vector-icons/Octicons", () => jest.fn(() => null));

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

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(),
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
    (useAppColorScheme as jest.Mock).mockReturnValue("light");
    Config.enableEngagement = true;
  });

  it("should hide personal tab when favorites are disabled", () => {
    Config.enableEngagement = false;
    render(<TabLayout />);
    expect(getPersonalTriggerProps()?.hidden).toBe(true);
  });

  it("should show personal tab when favorites are enabled", () => {
    Config.enableEngagement = true;
    render(<TabLayout />);
    expect(getPersonalTriggerProps()?.hidden).toBe(false);
  });
});
