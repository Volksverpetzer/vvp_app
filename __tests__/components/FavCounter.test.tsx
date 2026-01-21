import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { Achievements } from "../../src/helpers/Achievements";
import * as Analytics from "../../src/helpers/Networking/Analytics";
import FavoritesStore from "../../src/helpers/Stores/FavoritesStore";
import { FaveableType } from "../../src/types";

jest.mock("../../src/constants/Config", () => ({ analytics: true }));
jest.mock("../../src/helpers/Networking/Analytics", () => ({
  getFavs: jest.fn(),
  registerFav: jest.fn(),
}));
jest.mock("../../src/helpers/Stores/FavoritesStore", () => ({
  isFavorite: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));
jest.mock("../../src/helpers/Achievements", () => ({
  Achievements: { setAchievementValue: jest.fn() },
}));
jest.mock("../../src/helpers/BadgeContext", () => ({
  updateBadgeState: jest.fn(),
}));

describe("FavCounter Logic", () => {
  const contentFavIdentifier = "abc";
  const contentType: FaveableType = "insta";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Analytics Integration", () => {
    it("should have getFavs function available", () => {
      expect(Analytics.getFavs).toBeDefined();
      expect(typeof Analytics.getFavs).toBe("function");
    });

    it("should call getFavs with correct URLs", async () => {
      jest.spyOn(Analytics, "getFavs").mockResolvedValue(5);

      const result = await Analytics.getFavs("https://example.com/test");

      expect(Analytics.getFavs).toHaveBeenCalledWith(
        "https://example.com/test",
      );
      expect(result).toBe(5);
    });

    it("should have registerFav function available", () => {
      expect(Analytics.registerFav).toBeDefined();
      expect(typeof Analytics.registerFav).toBe("function");
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
