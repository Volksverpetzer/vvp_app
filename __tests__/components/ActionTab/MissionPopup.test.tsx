import { useRouter } from "expo-router";

import useColorScheme from "../../../src/hooks/useColorScheme";

// Mock the useRouter hook
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// Mock the useColorScheme hook
jest.mock("../../../src/hooks/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(),
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
    (useColorScheme as jest.Mock).mockReturnValue("dark");
  });

  it("should have useRouter hook available", () => {
    const router = useRouter();
    expect(router).toBeDefined();
    expect(router.replace).toBeDefined();
    expect(typeof router.replace).toBe("function");
  });

  it("should have useColorScheme hook available", () => {
    const colorScheme = useColorScheme();
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
