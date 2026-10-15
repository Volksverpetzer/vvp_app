import type { AppBskyFeedDefs } from "@atproto/api";
import { fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import BlueskyPostCard from "#/components/posts/bsky/BlueskyPostCard";
import { registerPostInteraction } from "#/helpers/network/Analytics";

const mockRouter = { push: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => mockRouter),
}));

jest.mock("react-native-hyperlink", () => ({
  Hyperlink: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("#/components/posts/bsky/BlueskyPostHeader", () => ({
  BlueskyPostHeader: jest.fn(() => null),
}));

jest.mock("#/components/Icons", () => ({
  ExternalLinkIcon: () => null,
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
    // Concrete fixture value from jest-setup, distinct from primary
    expect(StyleSheet.flatten(label.props.style).color).toBe("#0e5a7a");
  });

  it("shows the thread count in the link color when replies exist", async () => {
    const { getByText } = await render(
      <BlueskyPostCard
        post={makeFeedPost("Main post")}
        replies={[makeFeedPost("Reply", "reply1")]}
      />,
    );
    const label = getByText("Thread (1 von 2)");
    // Concrete fixture value from jest-setup, distinct from primary
    expect(StyleSheet.flatten(label.props.style).color).toBe("#0e5a7a");
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
});
