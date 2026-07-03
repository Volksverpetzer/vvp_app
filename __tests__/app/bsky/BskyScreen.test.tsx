import { render, waitFor } from "@testing-library/react-native";
import React from "react";

import BskyScreen from "#/app/bsky/[post_id]";

const mockRouterBack = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({ post_id: "test-post-id" })),
  useRouter: jest.fn(() => ({ back: mockRouterBack })),
}));

jest.mock("#/helpers/Stores/ContentStore", () => ({
  __esModule: true,
  default: {
    getStoredBskyPostById: jest.fn(),
  },
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

jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));
jest.mock("#/components/posts/bsky/BlueskyPostDetail", () =>
  jest.fn(() => null),
);
jest.mock("#/components/ui/UiSpinner", () => {
  const { Text } = require("react-native");
  return jest.fn(({ text }: any) => <Text testID="spinner">{text}</Text>);
});

const ContentStore = jest.requireMock("#/helpers/Stores/ContentStore").default;

const makeMockPost = () => ({
  post: {
    post: {
      uri: "at://did:plc:test/app.bsky.feed.post/abc123",
      author: { handle: "user.bsky.social" },
    },
  },
});

describe("BskyScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows spinner while post is loading", async () => {
    ContentStore.getStoredBskyPostById.mockReturnValue(new Promise(() => {}));
    const { getByTestId } = await render(<BskyScreen />);
    expect(getByTestId("spinner")).toBeTruthy();
  });

  it("renders post content after post is loaded", async () => {
    const BlueskyPostDetail = jest.requireMock(
      "#/components/posts/bsky/BlueskyPostDetail",
    );
    ContentStore.getStoredBskyPostById.mockResolvedValue(makeMockPost());

    await render(<BskyScreen />);

    await waitFor(() => {
      expect(BlueskyPostDetail).toHaveBeenCalled();
    });
  });

  it("calls router.back() when post is not found", async () => {
    ContentStore.getStoredBskyPostById.mockResolvedValue(null);

    await render(<BskyScreen />);

    await waitFor(() => {
      expect(mockRouterBack).toHaveBeenCalledTimes(1);
    });
  });
});
