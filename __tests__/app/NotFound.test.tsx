import { render } from "@testing-library/react-native";
import * as Linking from "expo-linking";

import NotFoundScreen from "#/app/+not-found";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
  usePathname: jest.fn(),
}));

jest.mock("expo-linking", () => ({
  openURL: jest.fn(() => Promise.resolve()),
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

    await Promise.resolve(); // flush useEffect

    expect(Linking.openURL).toHaveBeenCalledWith(
      `https://www.volksverpetzer.de${path}`,
    );
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("does not open URL or redirect for a regular not-found path", async () => {
    (usePathname as jest.Mock).mockReturnValue("/some/unknown-route");

    render(<NotFoundScreen />);

    await Promise.resolve();

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("navigates home even when openURL rejects", async () => {
    const path = "/wp-content/uploads/broken.pdf";
    (usePathname as jest.Mock).mockReturnValue(path);
    (Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error("failed"));

    render(<NotFoundScreen />);

    await Promise.resolve();
    await Promise.resolve(); // flush rejection handling

    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
