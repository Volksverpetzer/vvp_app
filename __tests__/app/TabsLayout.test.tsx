import { render } from "@testing-library/react-native";
import { Tabs } from "expo-router";

import TabLayout from "#/app/(tabs)/_layout";
import Config from "#/constants/Config";
import { useBadge } from "#/helpers/provider/BadgeProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  useBadge: jest.fn(),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    enabledActions: true,
    enableEngagement: true,
  },
}));

describe("TabLayout", () => {
  const tabsScreenSpy = jest.spyOn(Tabs, "Screen");

  const getPersonalTabProps = () => {
    const call = tabsScreenSpy.mock.calls.find(
      ([props]) => props?.name === "personal",
    );
    return call?.[0];
  };
  const getHrefFromOptions = (
    options: ReturnType<typeof getPersonalTabProps>["options"] | undefined,
  ) => {
    if (!options || typeof options === "function") return undefined;
    return options.href;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tabsScreenSpy.mockClear();
    (useBadge as jest.Mock).mockReturnValue({
      badgeState: { personal: false, action: false },
    });
    (useAppColorScheme as jest.Mock).mockReturnValue("light");
    Config.enableEngagement = true;
  });

  it("should hide personal tab when favorites are disabled", () => {
    Config.enableEngagement = false;

    render(<TabLayout />);

    const personalProps = getPersonalTabProps();

    expect(personalProps).toBeDefined();
    expect(getHrefFromOptions(personalProps?.options)).toBeNull();
  });

  it("should show personal tab when favorites are enabled", () => {
    Config.enableEngagement = true;

    render(<TabLayout />);

    const personalProps = getPersonalTabProps();

    expect(personalProps).toBeDefined();
    expect(getHrefFromOptions(personalProps?.options)).toBe("/personal");
  });
});
