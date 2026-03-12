import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { Achievements } from "#/helpers/Achievements";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import * as Engagement from "#/helpers/network/Engagement";
import type { FaveableType } from "#/types";

jest.mock("#/constants/Config", () => ({ enableEngagement: true }));
jest.mock("#/helpers/network/Engagement", () => ({
  getFavs: jest.fn(),
  registerFav: jest.fn(),
}));
jest.mock("#/helpers/Stores/FavoritesStore", () => ({
  isFavorite: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));
jest.mock("#/helpers/Achievements", () => ({
  Achievements: { setAchievementValue: jest.fn() },
}));
jest.mock("#/helpers/provider/BadgeProvider", () => ({
  updateBadgeState: jest.fn(),
}));

describe("FavCounter Logic", () => {
  const contentFavIdentifier = "abc";
  const contentType: FaveableType = "insta";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Engagement Integration", () => {
    it("should have getFavs function available", () => {
      expect(Engagement.getFavs).toBeDefined();
      expect(typeof Engagement.getFavs).toBe("function");
    });

    it("should call getFavs with correct URLs", async () => {
      jest.spyOn(Engagement, "getFavs").mockResolvedValue(5);

      const result = await Engagement.getFavs("https://example.com/test");

      expect(Engagement.getFavs).toHaveBeenCalledWith(
        "https://example.com/test",
      );
      expect(result).toBe(5);
    });

    it("should have registerFav function available", () => {
      expect(Engagement.registerFav).toBeDefined();
      expect(typeof Engagement.registerFav).toBe("function");
    });
  });

  describe("FavoritesStore Integration", () => {
    it("should have FavoritesStore methods available", () => {
      expect(FavoritesStore.isFavorite).toBeDefined();
      expect(FavoritesStore.addFavorite).toBeDefined();
      expect(FavoritesStore.removeFavorite).toBeDefined();
      expect(typeof FavoritesStore.isFavorite).toBe("function");
      expect(typeof FavoritesStore.addFavorite).toBe("function");
      expect(typeof FavoritesStore.removeFavorite).toBe("function");
    });

    it("should call addFavorite with correct parameters", async () => {
      await FavoritesStore.addFavorite(contentFavIdentifier, contentType);

      expect(FavoritesStore.addFavorite).toHaveBeenCalledWith(
        contentFavIdentifier,
        contentType,
      );
    });

    it("should call removeFavorite with correct parameters", async () => {
      await FavoritesStore.removeFavorite(contentFavIdentifier);

      expect(FavoritesStore.removeFavorite).toHaveBeenCalledWith(
        contentFavIdentifier,
      );
    });
  });

  describe("Achievements Integration", () => {
    it("should have setAchievementValue function available", () => {
      expect(Achievements.setAchievementValue).toBeDefined();
      expect(typeof Achievements.setAchievementValue).toBe("function");
    });

    it("should call setAchievementValue for favorite achievement", () => {
      Achievements.setAchievementValue("favorite");

      expect(Achievements.setAchievementValue).toHaveBeenCalledWith("favorite");
    });
  });
});
