import type { AppBskyFeedDefs } from "@atproto/api";
import { fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import BlueskyPostCard from "#/components/posts/bsky/BlueskyPostCard";
import { onLinkPress } from "#/helpers/Linking";
import { registerPostInteraction } from "#/helpers/network/Analytics";

const mockRouter = { push: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => mockRouter),
}));

// Renders the children plus a pressable stand-in that fires the Hyperlink's
// onPress with a fixed link, so tests can check the analytics context.
jest.mock("react-native-hyperlink", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  return {
    Hyperlink: ({
      children,
      onPress,
    }: {
      children: ReactNode;
      onPress?: (url: string) => void;
    }) => (
      <>
        {children}
        <Pressable
          accessibilityRole="button"
          onPress={() => onPress?.("https://example.com/linked")}
        >
          <Text>hyperlink-stub</Text>
        </Pressable>
      </>
    ),
  };
});

jest.mock("#/components/posts/bsky/BlueskyPostHeader", () => ({
  BlueskyPostHeader: jest.fn(() => null),
}));

jest.mock("#/components/Icons", () => ({
  ExternalLinkIcon: () => null,
}));

// Dark mode, where the 0.9.1 linkText (#4A9CC7) differs from primary
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "dark",
}));

jest.mock("#/helpers/Linking", () => ({
  onLinkPress: jest.fn(),
}));

jest.mock("#/helpers/Stores/ContentStore", () => ({
  __esModule: true,
  default: { setStoredBskyPostById: jest.fn() },
}));

jest.mock("#/helpers/network/Analytics", () => ({
  registerPostInteraction: jest.fn(),
}));

const makeFeedPost = (
  text: string,
  id = "abc123",
): AppBskyFeedDefs.FeedViewPost => ({
  post: {
    uri: `at://did:plc:test/app.bsky.feed.post/${id}`,
    cid: "bafyreiabc",
    author: { did: "did:plc:test", handle: "tester.bsky.social", labels: [] },
    record: { $type: "app.bsky.feed.post", text },
    indexedAt: "2024-01-01T00:00:00.000Z",
    viewer: {},
    labels: [],
  },
});

const longText = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");

describe("BlueskyPostCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the full text without a link label for a short post", async () => {
    const { getByText, queryByText } = await render(
      <BlueskyPostCard post={makeFeedPost("Short post")} />,
    );
    expect(getByText("Short post")).toBeTruthy();
    expect(queryByText("mehr")).toBeNull();
    expect(queryByText(/^Thread/)).toBeNull();
  });

  it("shows a 'mehr' label in the link color when the text is truncated", async () => {
    const { getByText } = await render(
      <BlueskyPostCard post={makeFeedPost(longText)} />,
    );
    const label = getByText("mehr");
    expect(StyleSheet.flatten(label.props.style).color).toBe("#4A9CC7");
  });

  it("shows the thread count in the link color when replies exist", async () => {
    const { getByText } = await render(
      <BlueskyPostCard
        post={makeFeedPost("Main post")}
        replies={[makeFeedPost("Reply", "reply1")]}
      />,
    );
    const label = getByText("Thread (1 von 2)");
    expect(StyleSheet.flatten(label.props.style).color).toBe("#4A9CC7");
  });

  it("navigates to the thread and tracks the open when pressed", async () => {
    const { getByText } = await render(
      <BlueskyPostCard post={makeFeedPost(longText)} />,
    );
    await fireEvent.press(getByText("mehr"));
    expect(registerPostInteraction).toHaveBeenCalledWith(
      "https://bsky.app/profile/tester.bsky.social/post/abc123",
      "bluesky",
      "open",
    );
    expect(mockRouter.push).toHaveBeenCalledWith("/bsky/abc123");
  });

  it("passes the post's bsky.app URL as context for links in the text", async () => {
    const { getByText } = await render(
      <BlueskyPostCard post={makeFeedPost("Short post")} />,
    );
    await fireEvent.press(getByText("hyperlink-stub"));
    expect(onLinkPress).toHaveBeenCalledWith(
      "https://example.com/linked",
      mockRouter,
      "https://bsky.app/profile/tester.bsky.social/post/abc123",
    );
  });

  it("passes the post's bsky.app URL as context for the open-in-Bluesky button", async () => {
    const { getAllByRole } = await render(
      <BlueskyPostCard post={makeFeedPost("Short post")} />,
    );
    // [0] is the card itself, [1] the external-link icon button
    await fireEvent.press(getAllByRole("button")[1]);
    expect(onLinkPress).toHaveBeenCalledWith(
      "https://bsky.app/profile/tester.bsky.social/post/abc123",
      mockRouter,
      "https://bsky.app/profile/tester.bsky.social/post/abc123",
    );
  });
});
