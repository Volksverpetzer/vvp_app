import { act, fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import InstaPostCard, {
  resetReportedSwipes,
} from "#/components/posts/insta/InstaPostCard";
import InstaPostDetail from "#/components/posts/insta/InstaPostDetail";
import InstaPostImage from "#/components/posts/insta/InstaPostImage";
import Config from "#/constants/Config";
import { registerPostInteraction } from "#/helpers/network/Analytics";
import { registerViews } from "#/helpers/network/Engagement";
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

/** Fires the mocked image's onPageChange, as a swipe to another photo does. */
const swipe = async () => {
  const { onPageChange } = (
    InstaPostImage as unknown as jest.Mock
  ).mock.calls.at(-1)[0];
  await act(() => onPageChange());
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
  beforeEach(() => {
    jest.clearAllMocks();
    resetReportedSwipes();
  });

  it("shows the 'mehr' label in the link color", async () => {
    const { getByText } = await render(<InstaPostCard {...post} />);
    expect(StyleSheet.flatten(getByText("mehr").props.style).color).toBe(
      "#4A9CC7",
    );
  });

  it("opens the post when pressed, leaving the open to the detail screen", async () => {
    const { getByText } = await render(<InstaPostCard {...post} />);
    await fireEvent.press(getByText("mehr"));
    expect(mockRouter.push).toHaveBeenCalledWith("/insta/insta1");
    expect(registerPostInteraction).not.toHaveBeenCalled();
  });

  it("sends nothing when the card is only scrolled into view", async () => {
    await render(<InstaPostCard {...post} inView />);
    await loadImage();

    expect(registerPostInteraction).not.toHaveBeenCalled();
    expect(registerViews).not.toHaveBeenCalled();
  });

  it("counts a swipe to another photo once per card", async () => {
    await render(<InstaPostCard {...post} inView />);
    await swipe();
    await swipe();

    expect(registerPostInteraction).toHaveBeenCalledTimes(1);
    expect(registerPostInteraction).toHaveBeenCalledWith(
      `${Config.wpUrl}/insta/abc/`,
      "instagram",
      "swipe",
    );
    expect(registerViews).not.toHaveBeenCalled();
  });

  // Feed cards sit in a virtualized list and unmount when scrolled far away.
  it("doesn't count the same post again after the card remounts", async () => {
    const first = await render(<InstaPostCard {...post} inView />);
    await swipe();
    await first.unmount();

    await render(<InstaPostCard {...post} inView />);
    await swipe();

    expect(registerPostInteraction).toHaveBeenCalledTimes(1);
  });

  it("counts a swipe on a different post", async () => {
    await render(<InstaPostCard {...post} inView />);
    await swipe();
    await render(<InstaPostCard {...post} id="insta2" inView />);
    await swipe();

    expect(registerPostInteraction).toHaveBeenCalledTimes(2);
  });
});

describe("InstaPostDetail", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sends nothing before the user swipes", async () => {
    await render(<InstaPostDetail {...post} />);
    expect(registerPostInteraction).not.toHaveBeenCalled();
  });

  it("counts a swipe to another photo once per screen visit", async () => {
    await render(<InstaPostDetail {...post} />);
    await swipe();
    await swipe();

    expect(registerPostInteraction).toHaveBeenCalledTimes(1);
    expect(registerPostInteraction).toHaveBeenCalledWith(
      `${Config.wpUrl}/insta/abc/`,
      "instagram",
      "swipe",
    );
  });

  it("colors caption links with the link color", async () => {
    const { getByText } = await render(<InstaPostDetail {...post} />);
    expect(getByText(post.caption)).toBeTruthy();
    expect(mockHyperlink).toHaveBeenCalledWith(
      expect.objectContaining({ linkStyle: { color: "#4A9CC7" } }),
    );
  });
});
