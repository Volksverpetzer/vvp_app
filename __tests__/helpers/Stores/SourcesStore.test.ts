import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { Achievements } from "#/helpers/Achievements";
import BaseStore from "#/helpers/Storage";
import SourcesStore from "#/helpers/Stores/SourcesStore";

// Mock the dependencies
jest.mock("#/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    parseJSON: jest.fn(),
  },
}));

jest.mock("#/helpers/Achievements", () => ({
  __esModule: true,
  Achievements: {
    setAchievementValue: jest.fn(),
  },
}));

describe("SourcesStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.toISOString to return a consistent value
    jest
      .spyOn(Date.prototype, "toISOString")
      .mockReturnValue("2023-01-01T12:00:00.000Z");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("onAddSource", () => {
    it("should add new source to empty storage", async () => {
      // Setup
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      // Execute
      await SourcesStore.onAddSource(
        "https://example.com",
        "test-slug",
        "Test text",
      );

      // Assert
      const expectedSources = {
        "https://example.com": {
          slug: "test-slug",
          text: "Test text",
          date: "2023-01-01T12:00:00.000Z",
        },
      };
      expect(BaseStore.getItem).toHaveBeenCalledWith("sources");
      expect(BaseStore.parseJSON).toHaveBeenCalledWith(undefined, {});
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "sources",
        JSON.stringify(expectedSources),
      );
      expect(Achievements.setAchievementValue).toHaveBeenCalledWith(
        "checksource",
      );
    });

    it("should add new source to existing sources", async () => {
      // Setup
      const existingSources = {
        "https://existing.com": {
          slug: "existing-slug",
          text: "Existing text",
          date: "2023-01-01T10:00:00.000Z",
        },
      };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(existingSources));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(existingSources);

      // Execute
      await SourcesStore.onAddSource("https://new.com", "new-slug", "New text");

      // Assert
      const expectedSources = {
        "https://existing.com": {
          slug: "existing-slug",
          text: "Existing text",
          date: "2023-01-01T10:00:00.000Z",
        },
        "https://new.com": {
          slug: "new-slug",
          text: "New text",
          date: "2023-01-01T12:00:00.000Z",
        },
      };
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "sources",
        JSON.stringify(expectedSources),
      );
      expect(Achievements.setAchievementValue).toHaveBeenCalledWith(
        "checksource",
      );
    });

    it("should add source without text parameter", async () => {
      // Setup
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      // Execute
      await SourcesStore.onAddSource("https://example.com", "test-slug");

      // Assert
      const expectedSources = {
        "https://example.com": {
          slug: "test-slug",
          text: undefined,
          date: "2023-01-01T12:00:00.000Z",
        },
      };
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "sources",
        JSON.stringify(expectedSources),
      );
      expect(Achievements.setAchievementValue).toHaveBeenCalledWith(
        "checksource",
      );
    });

    it("should overwrite existing source with same URL", async () => {
      // Setup
      const existingSources = {
        "https://example.com": {
          slug: "old-slug",
          text: "Old text",
          date: "2023-01-01T10:00:00.000Z",
        },
      };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(existingSources));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(existingSources);

      // Execute
      await SourcesStore.onAddSource(
        "https://example.com",
        "new-slug",
        "New text",
      );

      // Assert
      const expectedSources = {
        "https://example.com": {
          slug: "new-slug",
          text: "New text",
          date: "2023-01-01T12:00:00.000Z",
        },
      };
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "sources",
        JSON.stringify(expectedSources),
      );
      expect(Achievements.setAchievementValue).toHaveBeenCalledWith(
        "checksource",
      );
    });

    it("should handle undefined stored sources", async () => {
      // Setup
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(undefined);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      // Execute
      await SourcesStore.onAddSource(
        "https://example.com",
        "test-slug",
        "Test text",
      );

      // Assert
      expect(BaseStore.parseJSON).toHaveBeenCalledWith(undefined, {});
      expect(Achievements.setAchievementValue).toHaveBeenCalledWith(
        "checksource",
      );
    });
  });

  describe("getAllSources", () => {
    it("should return parsed sources when data exists", async () => {
      // Setup
      const mockSources = {
        "https://example.com": {
          slug: "test-slug",
          text: "Test text",
          date: "2023-01-01T12:00:00.000Z",
        },
        "https://another.com": {
          slug: "another-slug",
          text: "Another text",
          date: "2023-01-01T13:00:00.000Z",
        },
      };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(mockSources));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(mockSources);

      // Execute
      const result = await SourcesStore.getAllSources();

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("sources");
      expect(BaseStore.parseJSON).toHaveBeenCalledWith(
        JSON.stringify(mockSources),
        {},
      );
      expect(result).toEqual(mockSources);
    });

    it("should return empty object when no data exists", async () => {
      // Setup
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      // Execute
      const result = await SourcesStore.getAllSources();

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("sources");
      expect(BaseStore.parseJSON).toHaveBeenCalledWith(undefined, {});
      expect(result).toEqual({});
    });

    it("should return empty object when stored data is undefined", async () => {
      // Setup
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(undefined);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      // Execute
      const result = await SourcesStore.getAllSources();

      // Assert
      expect(BaseStore.getItem).toHaveBeenCalledWith("sources");
      expect(BaseStore.parseJSON).toHaveBeenCalledWith(undefined, {});
      expect(result).toEqual({});
    });

    it("should handle malformed JSON gracefully", async () => {
      // Setup
      jest.spyOn(BaseStore, "getItem").mockResolvedValue("invalid json");
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      // Execute
      const result = await SourcesStore.getAllSources();

      // Assert
      expect(BaseStore.parseJSON).toHaveBeenCalledWith("invalid json", {});
      expect(result).toEqual({});
    });
  });
});
