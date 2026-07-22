import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import MastodonPost from "#/components/posts/MastodonPost";
import {
  DISPLAY_TEXT_EXCERPT,
  DISPLAY_TEXT_FULL,
  DISPLAY_TEXT_NONE,
} from "#/types";

jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
jest.mock("react-native-hyperlink", () => {
  const { View } = require("react-native");
  return { Hyperlink: jest.fn(({ children }: any) => <View>{children}</View>) };
});
jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});
jest.mock("#/components/ui/UiPressable", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ children, onPress, ...rest }: any) => (
    <Pressable onPress={onPress} {...rest}>
      {children}
    </Pressable>
  ));
});
jest.mock("#/components/ui/UiSpace", () => () => null);
jest.mock("#/helpers/Linking", () => ({ onLinkPress: jest.fn() }));
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));
jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { primary: "#f00", textMuted: "#999" },
    dark: { primary: "#0f0", textMuted: "#666" },
  },
}));
jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { row: {} },
  POST_PADDING_HORIZONTAL: 30,
}));

const basePost = {
  id: 1,
  created_at: "2024-06-15T12:00:00Z",
  content: "<p>Hello world</p>",
  replies_count: 0,
  reblogs_count: 0,
  favourites_count: 0,
  answers: null,
  in_reply_to_id: 0,
  reblog: null,
  card: null,
  uri: "https://mastodon.social/@user/1",
  account: {
    id: 10,
    username: "user",
    uri: "https://mastodon.social/@user",
    acct: "user@mastodon.social",
    display_name: "Test User",
    followers_count: 0,
    following_count: 0,
    statuses_count: 0,
    avatar: "https://mastodon.social/avatar.jpg",
  },
};

describe("MastodonPost", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the account display name", async () => {
    const { getByText } = await render(<MastodonPost {...basePost} />);
    expect(getByText(/Test User/)).toBeTruthy();
  });

  it("renders the post content as excerpt by default", async () => {
    const { getByText } = await render(<MastodonPost {...basePost} />);
    expect(getByText("Hello world")).toBeTruthy();
  });

  it("renders full text when displayText is DISPLAY_TEXT_FULL", async () => {
    const { getByText } = await render(
      <MastodonPost {...basePost} displayText={DISPLAY_TEXT_FULL} />,
    );
    expect(getByText("Hello world")).toBeTruthy();
  });

  it("hides content when displayText is DISPLAY_TEXT_NONE", async () => {
    const { queryByText } = await render(
      <MastodonPost {...basePost} displayText={DISPLAY_TEXT_NONE} />,
    );
    expect(queryByText("Hello world")).toBeNull();
  });

  it("shows 'Mehr Lesen' when excerpt is shorter than full text", async () => {
    const longContent = "<p>" + "word ".repeat(100) + "</p>";
    const { getByText } = await render(
      <MastodonPost
        {...basePost}
        content={longContent}
        displayText={DISPLAY_TEXT_EXCERPT}
      />,
    );
    expect(getByText("Mehr Lesen")).toBeTruthy();
  });

  it("shows thread count when answers are present in DISPLAY_TEXT_EXCERPT mode", async () => {
    const { getByText } = await render(
      <MastodonPost
        {...basePost}
        answers={[basePost, basePost]}
        displayText={DISPLAY_TEXT_EXCERPT}
      />,
    );
    expect(getByText(/Thread 1 von 3/)).toBeTruthy();
  });

  it("renders answer content in DISPLAY_TEXT_FULL mode", async () => {
    const answer = { ...basePost, content: "<p>Answer text</p>" };
    const { getByText } = await render(
      <MastodonPost
        {...basePost}
        answers={[answer]}
        displayText={DISPLAY_TEXT_FULL}
      />,
    );
    expect(getByText("Answer text")).toBeTruthy();
  });

  it("navigates when pressed in excerpt mode", async () => {
    const { useRouter } = require("expo-router");
    const push = jest.fn();
    useRouter.mockReturnValue({ push });
    const { getByRole } = await render(
      <MastodonPost {...basePost} displayText={DISPLAY_TEXT_EXCERPT} />,
    );
    await fireEvent.press(getByRole("button"));
    expect(push).toHaveBeenCalledWith(`/bsky/${basePost.id}`);
  });
});
