import { fireEvent, render, waitFor } from "@testing-library/react-native";

import FavCounter from "#/components/counter/FavCounter";
import { Achievements } from "#/helpers/Achievements";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { getFavs, registerFav } from "#/helpers/network/Engagement";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import type { FaveableType, ShareableType } from "#/types";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { enableEngagement: true },
}));

const mockConfig = jest.requireMock("#/constants/Config").default as {
  enableEngagement: boolean;
};

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
  useCorporateColor: jest.fn(() => "#1b7194"),
  ColorScheme: { light: "light", dark: "dark" },
}));

jest.mock("#/components/Icons", () => ({
  StarIcon: ({ filled }: { filled?: boolean }) => {
    const { Text: MockText } = jest.requireActual("react-native");
    return <MockText>{filled ? "star-filled" : "star-outline"}</MockText>;
  },
}));

jest.mock("#/helpers/network/Engagement", () => ({
  getFavs: jest.fn(),
  registerFav: jest.fn(),
}));

jest.mock("#/helpers/Stores/FavoritesStore", () => ({
  __esModule: true,
  default: {
    isFavorite: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
  },
}));

jest.mock("#/helpers/Achievements", () => ({
  Achievements: { setAchievementValue: jest.fn() },
}));

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  updateBadgeState: jest.fn(),
}));

const shareable = [
  { url: "https://example.com/one", title: "One" },
  { url: "https://example.com/two", title: "Two" },
] as ShareableType[];

describe("FavCounter", () => {
  const contentFavIdentifier = "abc";
  const contentType: FaveableType = "insta";

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig.enableEngagement = true;
    jest.mocked(FavoritesStore.isFavorite).mockResolvedValue(false);
    jest.mocked(FavoritesStore.addFavorite).mockResolvedValue(undefined);
    jest.mocked(FavoritesStore.removeFavorite).mockResolvedValue(undefined);
    jest.mocked(getFavs).mockResolvedValue(0);
    jest.mocked(registerFav).mockResolvedValue(undefined);
  });

  it("loads and renders the total favorite count for every shareable URL", async () => {
    jest
      .mocked(getFavs)
      .mockImplementation((url) =>
        Promise.resolve(url === "https://example.com/one" ? 2 : 3),
      );

    const { getByText } = render(
      <FavCounter shareable={shareable} style={{}} />,
    );

    await waitFor(() => {
      expect(getByText("5")).toBeTruthy();
    });

    expect(getFavs).toHaveBeenNthCalledWith(1, "https://example.com/one");
    expect(getFavs).toHaveBeenNthCalledWith(2, "https://example.com/two");
    expect(FavoritesStore.isFavorite).not.toHaveBeenCalled();
  });

  it("adds a favorite, registers engagement, and increments the visible count", async () => {
    jest.mocked(getFavs).mockResolvedValue(2);

    const { getByRole, getByText, queryByText } = render(
      <FavCounter
        shareable={[shareable[0]]}
        style={{}}
        contentFavIdentifier={contentFavIdentifier}
        contentType={contentType}
      />,
    );

    await waitFor(() => {
      expect(getByText("2")).toBeTruthy();
      expect(getByText("star-outline")).toBeTruthy();
    });

    fireEvent.press(getByRole("button"));

    await waitFor(() => {
      expect(getByText("3")).toBeTruthy();
      expect(getByText("star-filled")).toBeTruthy();
    });

    expect(queryByText("2")).toBeNull();
    expect(Achievements.setAchievementValue).toHaveBeenCalledWith("favorite");
    expect(FavoritesStore.addFavorite).toHaveBeenCalledWith(
      contentFavIdentifier,
      contentType,
    );
    expect(updateBadgeState).toHaveBeenCalledWith({ personal: true });
    expect(registerFav).toHaveBeenCalledWith("https://example.com/one");
  });

  it("removes an existing favorite without registering a new engagement", async () => {
    jest.mocked(FavoritesStore.isFavorite).mockResolvedValue(true);
    jest.mocked(getFavs).mockResolvedValue(4);

    const { getByRole, getByText } = render(
      <FavCounter
        shareable={[shareable[0]]}
        style={{}}
        contentFavIdentifier={contentFavIdentifier}
        contentType={contentType}
      />,
    );

    await waitFor(() => {
      expect(getByText("5")).toBeTruthy();
      expect(getByText("star-filled")).toBeTruthy();
    });

    fireEvent.press(getByRole("button"));

    await waitFor(() => {
      expect(getByText("4")).toBeTruthy();
      expect(getByText("star-outline")).toBeTruthy();
    });

    expect(FavoritesStore.removeFavorite).toHaveBeenCalledWith(
      contentFavIdentifier,
    );
    expect(FavoritesStore.addFavorite).not.toHaveBeenCalled();
    expect(registerFav).not.toHaveBeenCalled();
  });

  it("renders an empty placeholder and skips engagement when disabled", () => {
    mockConfig.enableEngagement = false;

    const { queryByRole, queryByText } = render(
      <FavCounter
        shareable={shareable}
        style={{}}
        contentFavIdentifier={contentFavIdentifier}
        contentType={contentType}
      />,
    );

    expect(queryByRole("button")).toBeNull();
    expect(queryByText("0")).toBeNull();
    expect(getFavs).not.toHaveBeenCalled();
    expect(FavoritesStore.isFavorite).toHaveBeenCalledWith(
      contentFavIdentifier,
    );
  });
});
