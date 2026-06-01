import { render } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { PostText } from "#/components/posts/bsky/PostText";

// RichText from @atproto/api pulls in ESM-only deps (multiformats) that
// Jest cannot transform. Mock the whole package with a minimal stub.
jest.mock("@atproto/api", () => {
  class RichText {
    text: string;
    constructor({ text }: { text: string }) {
      this.text = text;
    }
    *segments() {
      yield {
        text: this.text,
        isLink: () => false,
        isMention: () => false,
      };
    }
  }
  return { RichText };
});

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("react-native-hyperlink", () => ({
  Hyperlink: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: { light: { primary: "#e00" } },
}));

jest.mock("#/helpers/Linking", () => ({ onLinkPress: jest.fn() }));

const makePost = (record: Record<string, unknown>) => ({
  post: {
    uri: "at://did:plc:test/app.bsky.feed.post/abc",
    cid: "bafy",
    author: { did: "did:plc:test", handle: "tester.bsky.social", labels: [] },
    record,
    indexedAt: "2024-01-01T00:00:00.000Z",
    viewer: {},
    labels: [],
  },
});

describe("PostText", () => {
  it("returns null when record has no text property", () => {
    const { toJSON } = render(
      // @ts-expect-error — intentionally passing minimal stub, not full FeedViewPost
      <PostText feedViewPost={makePost({ $type: "app.bsky.feed.post" })} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders plain text content", () => {
    const { getByText } = render(
      // @ts-expect-error — intentionally passing minimal stub, not full FeedViewPost
      <PostText
        feedViewPost={makePost({
          $type: "app.bsky.feed.post",
          text: "Hello Bluesky",
        })}
      />,
    );
    expect(getByText("Hello Bluesky")).toBeTruthy();
  });
});
