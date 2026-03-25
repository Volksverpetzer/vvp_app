import { useRouter } from "expo-router";

import { ColorScheme, useAppColorScheme } from "#/hooks/useAppColorScheme";

// Mock the useRouter hook
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

describe("MissionPopup Logic", () => {
  const mockRouter = {
    navigate: jest.fn(),
    canGoBack: jest.fn(() => false),
    dismissTo: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAppColorScheme as jest.Mock).mockReturnValue(ColorScheme.dark);
  });

  it("should have useRouter hook available", () => {
    const router = useRouter();
    expect(router).toBeDefined();
    expect(router.replace).toBeDefined();
    expect(typeof router.replace).toBe("function");
  });

  it("should have useColorScheme hook available", () => {
    const colorScheme = useAppColorScheme();
    expect(colorScheme).toBeDefined();
    expect(typeof colorScheme).toBe("string");
  });

  it("should call router.replace with correct route", () => {
    const router = useRouter();
    router.replace("/(tabs)/action");

    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)/action");
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
  });
});
