import { render, waitFor } from "@testing-library/react-native";
import React from "react";

import InstaScreen from "#/app/insta/[post_id]";

const mockRouterBack = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({ post_id: "test-post-id" })),
  useRouter: jest.fn(() => ({ back: mockRouterBack })),
}));

jest.mock("#/helpers/Stores/ContentStore", () => ({
  __esModule: true,
  default: {
    getStoredInstaPost: jest.fn(),
    setStoredInstaPost: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: { getInstaPost: jest.fn() },
}));

jest.mock("#/helpers/network/Engagement", () => ({
  registerViews: jest.fn(),
}));

jest.mock("#/helpers/Sharing", () => ({
  onShare: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://example.com" },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { background: "#ffffff", primary: "#1B7194" },
    dark: { background: "#000000", primary: "#3893C0" },
  },
}));

jest.mock("react-native-gesture-handler", () => ({
  ScrollView: jest.fn(({ children }: any) => children),
}));

jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));
jest.mock("#/components/posts/insta/InstaPostDetail", () =>
  jest.fn(() => null),
);
jest.mock("#/components/views/Footer", () => jest.fn(() => null));
jest.mock("#/components/ui/UiSpinner", () => {
  const { Text } = require("react-native");
  return jest.fn(({ text }: any) => <Text testID="spinner">{text}</Text>);
});

const ContentStore = jest.requireMock("#/helpers/Stores/ContentStore").default;

const makeMockInstaPost = () => ({
  id: "post123",
  media_url: "https://example.com/img.jpg",
  caption: "Test caption",
  media_type: "IMAGE",
  timestamp: "2024-01-01T00:00:00Z",
  permalink: "https://www.instagram.com/p/abc123/" as const,
});

describe("InstaScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows spinner while post is loading", () => {
    ContentStore.getStoredInstaPost.mockReturnValue(new Promise(() => {}));
    const { getByTestId } = render(<InstaScreen />);
    expect(getByTestId("spinner")).toBeTruthy();
  });

  it("renders post content after post is loaded from store", async () => {
    const InstaPostDetail = jest.requireMock(
      "#/components/posts/insta/InstaPostDetail",
    );
    ContentStore.getStoredInstaPost.mockResolvedValue(makeMockInstaPost());

    render(<InstaScreen />);

    await waitFor(() => {
      expect(InstaPostDetail).toHaveBeenCalled();
    });
  });

  it("calls router.back() when post is not found", async () => {
    ContentStore.getStoredInstaPost.mockResolvedValue(null);
    jest
      .requireMock("#/helpers/network/ServerAPI")
      .default.getInstaPost.mockResolvedValue(null);

    render(<InstaScreen />);

    await waitFor(() => {
      expect(mockRouterBack).toHaveBeenCalledTimes(1);
    });
  });
});
