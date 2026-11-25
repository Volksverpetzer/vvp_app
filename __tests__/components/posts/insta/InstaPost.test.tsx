import { act, fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import InstaPostCard from "#/components/posts/insta/InstaPostCard";
import InstaPostDetail from "#/components/posts/insta/InstaPostDetail";
import InstaPostImage from "#/components/posts/insta/InstaPostImage";
import Config from "#/constants/Config";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import {
  registerInstaImpression,
  registerViews,
} from "#/helpers/network/Engagement";
import type { InstaPostProperties } from "#/types";

const mockRouter = { push: jest.fn(), back: jest.fn() };
const mockHyperlink = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => mockRouter),
}));

jest.mock("react-native-hyperlink", () => ({
  Hyperlink: (props: { children: ReactNode; linkStyle: object }) => {
    mockHyperlink(props);
    return <>{props.children}</>;
  },
}));

jest.mock("#/components/posts/insta/InstaPostImage", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "dark",
  useCorporateColor: () => "#2E769C",
  useLinkColor: () => "#4A9CC7",
}));

jest.mock("#/hooks/useFeedDimensions", () => ({
  useFeedDimensions: () => ({ width: 300 }),
}));

jest.mock("#/helpers/network/Analytics", () => ({
  registerPostInteraction: jest.fn(),
}));

jest.mock("#/helpers/network/Engagement", () => ({
  registerInstaImpression: jest.fn(),
  registerViews: jest.fn(),
}));

jest.mock("#/helpers/Stores/ContentStore", () => ({
  __esModule: true,
  default: { setStoredInstaPost: jest.fn() },
}));

/** Fires the mocked image's onFirstLoad, as the real image does once loaded. */
const loadImage = async () => {
  const { onFirstLoad } = (
    InstaPostImage as unknown as jest.Mock
  ).mock.calls.at(-1)[0];
  await act(() => onFirstLoad());
};

const post: InstaPostProperties = {
  id: "insta1",
  permalink: "https://www.instagram.com/p/abc/",
  media_url: "https://example.com/a.jpg",
  caption: "Ein Instagram-Post mit https://example.com",
  media_type: "IMAGE",
  timestamp: "2026-10-01T00:00:00Z",
};

describe("InstaPostCard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the 'mehr' label in the link color", async () => {
    const { getByText } = await render(<InstaPostCard {...post} />);
    expect(StyleSheet.flatten(getByText("mehr").props.style).color).toBe(
      "#4A9CC7",
    );
  });

  it("opens the post and tracks the open when pressed", async () => {
    const { getByText } = await render(<InstaPostCard {...post} />);
    await fireEvent.press(getByText("mehr"));
    expect(registerPostInteraction).toHaveBeenCalledWith(
      expect.stringContaining("/insta/abc/"),
      "instagram",
      "open",
    );
    expect(mockRouter.push).toHaveBeenCalledWith("/insta/insta1");
  });

  // Feed impressions must stay off Plausible's "pageview" (registerViews),
  // or they'd land in Top Pages and skew bounce rate.
  it("registers an impression, not a page view, once in view and loaded", async () => {
    const view = await render(<InstaPostCard {...post} inView />);
    expect(registerInstaImpression).not.toHaveBeenCalled();

    await loadImage();
    await view.rerender(<InstaPostCard {...post} inView />);

    expect(registerInstaImpression).toHaveBeenCalledTimes(1);
    expect(registerInstaImpression).toHaveBeenCalledWith(
      `${Config.wpUrl}/insta/abc/`,
    );
    expect(registerViews).not.toHaveBeenCalled();
  });

  it("doesn't register an impression while out of view", async () => {
    await render(<InstaPostCard {...post} inView={false} />);
    await loadImage();

    expect(registerInstaImpression).not.toHaveBeenCalled();
    expect(registerViews).not.toHaveBeenCalled();
  });
});

describe("InstaPostDetail", () => {
  it("colors caption links with the link color", async () => {
    const { getByText } = await render(<InstaPostDetail {...post} />);
    expect(getByText(post.caption)).toBeTruthy();
    expect(mockHyperlink).toHaveBeenCalledWith(
      expect.objectContaining({ linkStyle: { color: "#4A9CC7" } }),
    );
  });
});
