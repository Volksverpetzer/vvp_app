import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BaseStore from "../../../src/helpers/Storage";
import FavoritesStore from "../../../src/helpers/Stores/FavoritesStore";
import { StoredFav } from "../../../src/types";

// Mock the BaseStore
jest.mock("../../../src/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    parseJSON: jest.fn(),
  },
}));

describe("FavoritesStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getStoredFavs", () => {
    it("should return parsed favorites when data exists", async () => {
      // Setup
      const mockFavs = { article1: { contentType: "article" } };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue('{"article1":{"contentType":"article"}}');
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(mockFavs);

      // Execute
      const result = await FavoritesStore.getStoredFavs();

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("favs");
      expect(BaseStore.parseJSON).toHaveBeenCalledWith(
        '{"article1":{"contentType":"article"}}',
        {},
      );
      expect(result).toEqual(mockFavs);
    });

    it("should return empty object when no data exists", async () => {
      // Setup
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      // Execute
      const result = await FavoritesStore.getStoredFavs();

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("favs");
      expect(result).toEqual({});
    });

    it("should handle errors and return empty object", async () => {
      // Setup
      jest
        .spyOn(BaseStore, "getItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Execute
      const result = await FavoritesStore.getStoredFavs();

      // Assert
      expect(result).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error retrieving stored favorites:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("setStoredFavs", () => {
    it("should store favorites as JSON string", async () => {
      // Setup
      const mockFavs: StoredFav = { article1: { contentType: "article" } };

      // Execute
      await FavoritesStore.setStoredFavs(mockFavs);

      // Assert
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "favs",
        JSON.stringify(mockFavs),
      );
    });

    it("should handle errors gracefully", async () => {
      // Setup
      const mockFavs: StoredFav = { article1: { contentType: "article" } };
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Execute
      await FavoritesStore.setStoredFavs(mockFavs);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving favorites:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe("addFavorite", () => {
    it("should add new favorite to existing favorites", async () => {
      // Setup
      const existingFavs = { article1: { contentType: "article" } };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(existingFavs));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(existingFavs);

      // Execute
      await FavoritesStore.addFavorite("article2", "article");

      // Assert
      const expectedFavs = {
        article1: { contentType: "article" },
        article2: { contentType: "article" },
      };
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "favs",
        JSON.stringify(expectedFavs),
      );
    });

    it("should add favorite to empty favorites", async () => {
      // Setup
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      // Execute
      await FavoritesStore.addFavorite("article1", "article");

      // Assert
      const expectedFavs = { article1: { contentType: "article" } };
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "favs",
        JSON.stringify(expectedFavs),
      );
    });
  });

  describe("isFavorite", () => {
    it("should return true when content is favorited", async () => {
      // Setup
      const mockFavs = { article1: { contentType: "article" } };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(mockFavs));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(mockFavs);

      // Execute
      const result = await FavoritesStore.isFavorite("article1");

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when content is not favorited", async () => {
      // Setup
      const mockFavs = { article1: { contentType: "article" } };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(mockFavs));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(mockFavs);

      // Execute
      const result = await FavoritesStore.isFavorite("article2");

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when no favorites exist", async () => {
      // Setup
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      // Execute
      const result = await FavoritesStore.isFavorite("article1");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("removeFavorite", () => {
    it("should remove existing favorite", async () => {
      // Setup
      const existingFavs = {
        article1: { contentType: "article" },
        article2: { contentType: "article" },
      };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(existingFavs));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(existingFavs);

      // Execute
      await FavoritesStore.removeFavorite("article1");

      // Assert
      const expectedFavs = { article2: { contentType: "article" } };
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "favs",
        JSON.stringify(expectedFavs),
      );
    });

    it("should do nothing when favorite does not exist", async () => {
      // Setup
      const existingFavs = { article1: { contentType: "article" } };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(existingFavs));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(existingFavs);

      // Execute
      await FavoritesStore.removeFavorite("article2");

      // Assert - setItem should not be called since favorite doesn't exist
      expect(BaseStore.setItem).not.toHaveBeenCalled();
    });
  });

  describe("getAllFavorites", () => {
    it("should return all stored favorites", async () => {
      // Setup
      const mockFavs = {
        article1: { contentType: "article" },
        post1: { contentType: "post" },
      };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(mockFavs));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(mockFavs);

      // Execute
      const result = await FavoritesStore.getAllFavorites();

      // Assert
      expect(result).toEqual(mockFavs);
    });
  });
});
