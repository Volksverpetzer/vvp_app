import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BaseStore from "#/helpers/Storage";
import ContentStore from "#/helpers/Stores/ContentStore";
import type { ArticleProperties, BlueskyPostProperties } from "#/types";

jest.mock("#/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    parseJSON: jest.fn(),
    removePrefixedItems: jest.fn(),
  },
}));

const prefix = "content_";

const mockArticle = {
  id: 1,
  slug: "test-article",
  title: "Test",
} as unknown as ArticleProperties;

const mockBskyPost = {
  uri: "at://did:plc:abc/app.bsky.feed.post/xyz",
  cid: "abc",
} as unknown as BlueskyPostProperties;

describe("ContentStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getStoredArticle", () => {
    it("returns a parsed article for the given slug", async () => {
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(mockArticle));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(mockArticle);

      const result = await ContentStore.getStoredArticle("test-article");

      expect(BaseStore.getItem).toHaveBeenCalledWith(prefix + "test-article");
      expect(result).toEqual(mockArticle);
    });

    it("returns undefined when not found", async () => {
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(undefined);

      const result = await ContentStore.getStoredArticle("missing");

      expect(result).toBeUndefined();
    });

    it("returns undefined on error", async () => {
      jest
        .spyOn(BaseStore, "getItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await ContentStore.getStoredArticle("slug");

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error retrieving stored article:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("setStoredArticle", () => {
    it("stores an article under its slug", async () => {
      await ContentStore.setStoredArticle("test-article", mockArticle);
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        prefix + "test-article",
        JSON.stringify(mockArticle),
      );
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await ContentStore.setStoredArticle("slug", mockArticle);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error saving article:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("multi-site article keying", () => {
    const vvpArticle = {
      slug: "shared-slug",
      link: "https://www.volksverpetzer.de/faktencheck/shared-slug",
      title: "VVP",
    } as unknown as ArticleProperties;
    const ppArticle = {
      slug: "shared-slug",
      link: "https://pruefpunkt.org/faktencheck/shared-slug",
      title: "PP",
    } as unknown as ArticleProperties;

    it("keys a stored article by its site host so colliding slugs don't clash", async () => {
      await ContentStore.setStoredArticle("shared-slug", vvpArticle);
      await ContentStore.setStoredArticle("shared-slug", ppArticle);

      expect(BaseStore.setItem).toHaveBeenCalledWith(
        prefix + "volksverpetzer.de_shared-slug",
        JSON.stringify(vvpArticle),
      );
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        prefix + "pruefpunkt.org_shared-slug",
        JSON.stringify(ppArticle),
      );
    });

    it("reads an article under the requested site host", async () => {
      jest.spyOn(BaseStore, "getItem").mockResolvedValue(null);
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(undefined);

      await ContentStore.getStoredArticle("shared-slug", "pruefpunkt.org");

      expect(BaseStore.getItem).toHaveBeenCalledWith(
        prefix + "pruefpunkt.org_shared-slug",
      );
    });
  });

  describe("getStoredBskyPostById", () => {
    it("returns a parsed Bluesky post for the given id", async () => {
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(mockBskyPost));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(mockBskyPost);

      const result = await ContentStore.getStoredBskyPostById("xyz");

      expect(BaseStore.getItem).toHaveBeenCalledWith(prefix + "xyz");
      expect(result).toEqual(mockBskyPost);
    });

    it("returns undefined on error", async () => {
      jest
        .spyOn(BaseStore, "getItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await ContentStore.getStoredBskyPostById("xyz");

      expect(result).toBeUndefined();
      consoleSpy.mockRestore();
    });
  });

  describe("setStoredBskyPostById", () => {
    it("stores a Bluesky post under its id", async () => {
      await ContentStore.setStoredBskyPostById("xyz", mockBskyPost);
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        prefix + "xyz",
        JSON.stringify(mockBskyPost),
      );
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await ContentStore.setStoredBskyPostById("xyz", mockBskyPost);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error saving post:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("removeStoredBskyPosts", () => {
    it("removes all content-prefixed items", async () => {
      await ContentStore.removeStoredBskyPosts();
      expect(BaseStore.removePrefixedItems).toHaveBeenCalledWith(prefix);
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(BaseStore, "removePrefixedItems")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await ContentStore.removeStoredBskyPosts();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error removing stored posts:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("clear", () => {
    it("removes all content-prefixed items", async () => {
      await ContentStore.clear();
      expect(BaseStore.removePrefixedItems).toHaveBeenCalledWith(prefix);
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(BaseStore, "removePrefixedItems")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await ContentStore.clear();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error clearing stored content:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
});
