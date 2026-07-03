import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import RedditPost from "#/components/posts/RedditPost";

const mockPush = jest.fn();

jest.mock("expo-image", () => ({
  Image: jest.fn(() => null),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock("#/helpers/Sharing", () => ({
  onShare: jest.fn(),
}));

jest.mock("#/components/ui/UiPressable", () => {
  const { TouchableOpacity } = require("react-native");
  return jest.fn(({ children, onPress, onLongPress, ...rest }: any) => (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} {...rest}>
      {children}
    </TouchableOpacity>
  ));
});

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

const baseProps = {
  is_reddit_media_domain: false,
  url_overridden_by_dest: "https://example.com/image.jpg",
  title: "Test Reddit Post",
  created_utc: new Date("2024-03-15").getTime() / 1000,
  permalink: "/r/test/comments/abc123",
  author: "testuser",
  thumbnail: "https://example.com/thumbnail.jpg",
};

describe("RedditPost", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders title and author", async () => {
    const { getByText } = await render(<RedditPost {...baseProps} />);
    expect(getByText("Test Reddit Post")).toBeTruthy();
    expect(getByText(/testuser/)).toBeTruthy();
  });

  it("navigates to /image with the URL on press", async () => {
    const { getByRole } = await render(<RedditPost {...baseProps} />);
    await fireEvent.press(getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/image",
      params: { uri: "https://example.com/image.jpg" },
    });
  });

  it("calls onShare on long press", async () => {
    const { onShare } = jest.requireMock("#/helpers/Sharing");
    const { getByRole } = await render(<RedditPost {...baseProps} />);
    await fireEvent(getByRole("button"), "longPress");
    expect(onShare).toHaveBeenCalledWith("https://example.com/image.jpg", {
      location: "RedditPost",
    });
  });

  it("uses crosspost author when available", async () => {
    const { getByText } = await render(
      <RedditPost
        {...baseProps}
        crosspost_parent_list={[{ author: "crosspostuser" }]}
      />,
    );
    expect(getByText(/crosspostuser/)).toBeTruthy();
  });

  it("uses thumbnail when inView is false", async () => {
    const { Image } = require("expo-image");
    await render(<RedditPost {...baseProps} inView={false} />);
    const [props] = Image.mock.calls[0];
    expect(props.source.uri).toBe("https://example.com/thumbnail.jpg");
  });

  it("uses full url when inView is true", async () => {
    const { Image } = require("expo-image");
    await render(<RedditPost {...baseProps} inView />);
    const [props] = Image.mock.calls[0];
    expect(props.source.uri).toBe("https://example.com/image.jpg");
  });

  it("uses smaller font size for long titles", async () => {
    const UiText = jest.requireMock("#/components/ui/UiText");
    const longTitle = "A".repeat(101);
    await render(<RedditPost {...baseProps} title={longTitle} />);
    const titleCallProps = UiText.mock.calls
      .map(([p]: any) => p)
      .find((p: any) => p.children === longTitle);
    expect(titleCallProps?.style).toEqual(
      expect.objectContaining({ fontSize: 16 }),
    );
  });

  it("uses normal font size for short titles", async () => {
    const UiText = jest.requireMock("#/components/ui/UiText");
    await render(<RedditPost {...baseProps} />);
    const titleCallProps = UiText.mock.calls
      .map(([p]: any) => p)
      .find((p: any) => p.children === "Test Reddit Post");
    expect(titleCallProps?.style).toEqual(
      expect.objectContaining({ fontSize: 18 }),
    );
  });
});
