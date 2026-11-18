import { act, renderHook, waitFor } from "@testing-library/react-native";

import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { useFavorite } from "#/hooks/useFavorite";

jest.mock("#/helpers/network/Engagement", () => ({
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

describe("useFavorite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(FavoritesStore.isFavorite).mockResolvedValue(false);
    jest.mocked(FavoritesStore.addFavorite).mockResolvedValue(undefined);
    jest.mocked(FavoritesStore.removeFavorite).mockResolvedValue(undefined);
  });

  it("ignores a second tap while the first add is still being saved", async () => {
    let finishAdd: () => void = () => {};
    jest.mocked(FavoritesStore.addFavorite).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishAdd = resolve;
        }),
    );

    const { result } = await renderHook(() => useFavorite("abc", "insta"));
    await waitFor(() =>
      expect(FavoritesStore.isFavorite).toHaveBeenCalledWith("abc"),
    );

    await act(async () => {
      // Both taps land before the first save resolves.
      const firstTap = result.current.toggleFavorite();
      const secondTap = result.current.toggleFavorite();
      finishAdd();
      await Promise.all([firstTap, secondTap]);
    });

    expect(FavoritesStore.addFavorite).toHaveBeenCalledTimes(1);
    expect(FavoritesStore.removeFavorite).not.toHaveBeenCalled();
    expect(result.current.isFav).toBe(true);
  });

  it("ignores an initial read that resolves after a tap", async () => {
    let finishInitialRead: (value: boolean) => void = () => {};
    jest.mocked(FavoritesStore.isFavorite).mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finishInitialRead = resolve;
        }),
    );

    const { result } = await renderHook(() => useFavorite("abc", "insta"));

    await act(async () => {
      await result.current.toggleFavorite();
    });
    // The read started before the tap and reports the old state.
    await act(async () => {
      finishInitialRead(false);
      await Promise.resolve();
    });

    expect(result.current.isFav).toBe(true);
  });

  it("removes on a tap that lands before the re-render after an add", async () => {
    const { result } = await renderHook(() => useFavorite("abc", "insta"));
    await waitFor(() =>
      expect(FavoritesStore.isFavorite).toHaveBeenCalledWith("abc"),
    );

    await act(async () => {
      // Same (stale) toggleFavorite closure for both taps.
      const toggle = result.current.toggleFavorite;
      await toggle();
      await toggle();
    });

    expect(FavoritesStore.addFavorite).toHaveBeenCalledTimes(1);
    expect(FavoritesStore.removeFavorite).toHaveBeenCalledWith("abc");
    expect(result.current.isFav).toBe(false);
  });
});
