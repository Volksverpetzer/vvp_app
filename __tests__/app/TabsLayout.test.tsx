import { render } from "@testing-library/react-native";

const mockTabsScreen = jest.fn(() => null);

jest.mock("expo-router", () => {
  const React = require("react");

  const Tabs = ({ children }) => <>{children}</>;
  Tabs.Screen = mockTabsScreen;

  return {
    Tabs,
  };
});

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
    enableFavorites: true,
  },
}));

describe("TabLayout", () => {
  const TabLayout = require("#/app/(tabs)/_layout").default;
  const Config = require("#/constants/Config").default;
  const { useBadge } = require("#/helpers/provider/BadgeProvider");
  const { useAppColorScheme } = require("#/hooks/useAppColorScheme");

  beforeEach(() => {
    jest.clearAllMocks();
    (useBadge as jest.Mock).mockReturnValue({
      badgeState: { personal: false, action: false },
    });
    (useAppColorScheme as jest.Mock).mockReturnValue("light");
    Config.enableFavorites = true;
  });

  it("should hide personal tab when favorites are disabled", () => {
    Config.enableFavorites = false;

    render(<TabLayout />);

    const personalCall = mockTabsScreen.mock.calls.find(
      ([props]) => props.name === "personal",
    );

    expect(personalCall).toBeDefined();
    expect(personalCall[0].options.href).toBeNull();
  });

  it("should show personal tab when favorites are enabled", () => {
    Config.enableFavorites = true;

    render(<TabLayout />);

    const personalCall = mockTabsScreen.mock.calls.find(
      ([props]) => props.name === "personal",
    );

    expect(personalCall).toBeDefined();
    expect(personalCall[0].options.href).toBe("/personal");
  });
});
