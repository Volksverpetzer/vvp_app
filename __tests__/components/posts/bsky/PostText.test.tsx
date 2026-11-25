import { fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { PostText } from "#/components/posts/bsky/PostText";
import { onLinkPress } from "#/helpers/Linking";

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

const mockRouter = { push: jest.fn() };

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
    cid: "cid-stub",
    author: { did: "did:plc:test", handle: "tester.bsky.social", labels: [] },
    record,
    indexedAt: "2024-01-01T00:00:00.000Z",
    viewer: {},
    labels: [],
  },
});

describe("PostText", () => {
  it("returns null when record has no text property", async () => {
    const { toJSON } = await render(
      <PostText feedViewPost={makePost({ $type: "app.bsky.feed.post" })} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders plain text content", async () => {
    const { getByText } = await render(
      <PostText
        feedViewPost={makePost({
          $type: "app.bsky.feed.post",
          text: "Hello Bluesky",
        })}
      />,
    );
    expect(getByText("Hello Bluesky")).toBeTruthy();
  });

  it("passes the given context URL to onLinkPress for links", async () => {
    const { getByText } = await render(
      <PostText
        feedViewPost={makePost({
          $type: "app.bsky.feed.post",
          text: "Hello Bluesky",
        })}
        contextUrl="https://bsky.app/profile/tester.bsky.social/post/root"
      />,
    );
    await fireEvent.press(getByText("hyperlink-stub"));
    expect(onLinkPress).toHaveBeenCalledWith(
      "https://example.com/linked",
      mockRouter,
      "https://bsky.app/profile/tester.bsky.social/post/root",
    );
  });
});
