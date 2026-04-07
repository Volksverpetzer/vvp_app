import { render, waitFor } from "@testing-library/react-native";

import NotFoundScreen from "#/app/+not-found";

const mockReplace = jest.fn();
const mockOutBoundLinkPress = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
  usePathname: jest.fn(),
}));

jest.mock("#/helpers/Linking", () => ({
  outBoundLinkPress: (...args: unknown[]) => mockOutBoundLinkPress(...args),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://www.volksverpetzer.de" },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
  useCorporateColor: jest.fn(() => "#1B7194"),
  ColorScheme: { light: "light", dark: "dark" },
}));

jest.mock("#/components/design/EmptyComponent", () => () => null);

describe("NotFoundScreen", () => {
  const { usePathname } = jest.requireMock("expo-router");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens excluded URL externally and navigates home", async () => {
    const path = "/wp-content/uploads/2024/11/file.pdf";
    (usePathname as jest.Mock).mockReturnValue(path);

    render(<NotFoundScreen />);

    await waitFor(() => {
      expect(mockOutBoundLinkPress).toHaveBeenCalledWith(
        `https://www.volksverpetzer.de${path}`,
      );
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("does not open URL or redirect for a regular not-found path", async () => {
    (usePathname as jest.Mock).mockReturnValue("/some/unknown-route");

    render(<NotFoundScreen />);

    await waitFor(() => {
      expect(mockOutBoundLinkPress).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
