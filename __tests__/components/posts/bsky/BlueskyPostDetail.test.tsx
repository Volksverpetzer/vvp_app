import type { AppBskyFeedDefs } from "@atproto/api";
import { fireEvent, render } from "@testing-library/react-native";

import BlueskyPostDetail from "#/components/posts/bsky/BlueskyPostDetail";
import { onLinkPress } from "#/helpers/Linking";

const mockRouter = { push: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => mockRouter),
}));

jest.mock("react-native-hyperlink", () => ({
  Hyperlink: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("#/components/posts/bsky/BlueskyPostHeader", () => ({
  BlueskyPostHeader: jest.fn(() => null),
}));

jest.mock("#/components/posts/bsky/PostText", () => ({
  PostText: jest.fn(() => null),
}));

jest.mock("#/components/Icons", () => ({
  ExternalLinkIcon: () => null,
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://www.volksverpetzer.de" },
}));

jest.mock("#/helpers/Linking", () => ({
  onLinkPress: jest.fn(),
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

describe("BlueskyPostDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the post text content", () => {
    const { getByText } = render(
      <BlueskyPostDetail post={makeFeedPost("Hello test post")} />,
    );
    expect(getByText("Hello test post")).toBeTruthy();
  });

  it("renders the external link button with the correct accessibility label", () => {
    const { getByRole } = render(
      <BlueskyPostDetail post={makeFeedPost("Some text")} />,
    );
    expect(getByRole("button", { name: "In Bluesky öffnen" })).toBeTruthy();
  });

  it("pressing the external link button calls onLinkPress with the Bluesky post URL", () => {
    const { getByRole } = render(
      <BlueskyPostDetail post={makeFeedPost("Some text")} />,
    );
    fireEvent.press(getByRole("button", { name: "In Bluesky öffnen" }));
    expect(onLinkPress).toHaveBeenCalledTimes(1);
    expect(onLinkPress).toHaveBeenCalledWith(
      "https://bsky.app/profile/tester.bsky.social/post/abc123",
      mockRouter,
      "https://www.volksverpetzer.de",
    );
  });

  it("renders a PostText for each reply when replies are provided", () => {
    const { PostText } = jest.requireMock(
      "#/components/posts/bsky/PostText",
    ) as { PostText: jest.Mock };
    const reply1 = makeFeedPost("Reply one", "reply1");
    const reply2 = makeFeedPost("Reply two", "reply2");

    render(
      <BlueskyPostDetail
        post={makeFeedPost("Main post")}
        replies={[reply1, reply2]}
      />,
    );

    expect(PostText).toHaveBeenCalledTimes(2);
    const calledWithProps = PostText.mock.calls.map(([props]) => props);
    expect(calledWithProps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ feedViewPost: reply1 }),
        expect.objectContaining({ feedViewPost: reply2 }),
      ]),
    );
  });

  it("renders no PostText when replies is not provided", () => {
    const { PostText } = jest.requireMock(
      "#/components/posts/bsky/PostText",
    ) as { PostText: jest.Mock };

    render(<BlueskyPostDetail post={makeFeedPost("Main post")} />);

    expect(PostText).not.toHaveBeenCalled();
  });

  it("renders no PostText when replies is an empty array", () => {
    const { PostText } = jest.requireMock(
      "#/components/posts/bsky/PostText",
    ) as { PostText: jest.Mock };

    render(<BlueskyPostDetail post={makeFeedPost("Main post")} replies={[]} />);

    expect(PostText).not.toHaveBeenCalled();
  });
});
