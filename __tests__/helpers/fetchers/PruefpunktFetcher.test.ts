import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import PruefpunktAPI from "#/helpers/network/PruefpunktAPI";
import { PruefpunktFetcher } from "#/screens/Home/fetchers/PruefpunktFetcher";
import { WordPressFetcher } from "#/screens/Home/fetchers/WordPressFetcher";
import type { ArticleProperties, LoadArticlePostProperties } from "#/types";

jest.mock("#/helpers/network/PruefpunktAPI", () => ({
  __esModule: true,
  default: {
    getPosts: jest.fn(),
    searchPosts: jest.fn(),
  },
}));

jest.mock("#/screens/Home/fetchers/WordPressFetcher", () => ({
  WordPressFetcher: {
    mapArticleToPost: jest.fn(),
  },
}));

const makeArticle = (id = 1): Partial<LoadArticlePostProperties> => ({
  id,
  slug: `article-${id}`,
  date_gmt: "2024-01-01T00:00:00Z",
  link: `https://www.pruefpunkt.org/article-${id}` as any,
});

const makePost = (id = 1) => ({
  data: { article: { id } as Partial<ArticleProperties> },
});

describe("PruefpunktFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("feedFetcher", () => {
    it("calls PruefpunktAPI.getPosts with the given page", async () => {
      jest.spyOn(PruefpunktAPI, "getPosts").mockResolvedValue([]);

      await PruefpunktFetcher.feedFetcher({ page: 3 });

      expect(PruefpunktAPI.getPosts).toHaveBeenCalledWith(3);
    });

    it("defaults to page 1", async () => {
      jest.spyOn(PruefpunktAPI, "getPosts").mockResolvedValue([]);

      await PruefpunktFetcher.feedFetcher({});

      expect(PruefpunktAPI.getPosts).toHaveBeenCalledWith(1);
    });

    it("sets sourceName to 'Prüfpunkt' on every returned post", async () => {
      const articles = [
        makeArticle(1),
        makeArticle(2),
      ] as LoadArticlePostProperties[];
      jest.spyOn(PruefpunktAPI, "getPosts").mockResolvedValue(articles);

      let callIndex = 0;
      const posts = articles.map((a) => makePost(a.id));
      jest
        .spyOn(WordPressFetcher, "mapArticleToPost")
        .mockImplementation(() => posts[callIndex++] as any);

      const result = await PruefpunktFetcher.feedFetcher({ page: 1 });

      expect(result).toHaveLength(2);
      expect(result[0].data.article.sourceName).toBe("Prüfpunkt");
      expect(result[1].data.article.sourceName).toBe("Prüfpunkt");
    });

    it("returns empty array and logs error on API failure", async () => {
      const error = new Error("network failure");
      jest.spyOn(PruefpunktAPI, "getPosts").mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await PruefpunktFetcher.feedFetcher({ page: 1 });

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Pruefpunkt Error:", error);
    });
  });

  describe("searchFetcher", () => {
    it("calls PruefpunktAPI.searchPosts with the given param", async () => {
      jest.spyOn(PruefpunktAPI, "searchPosts").mockResolvedValue([]);

      await PruefpunktFetcher.searchFetcher({ param: "impfung" });

      expect(PruefpunktAPI.searchPosts).toHaveBeenCalledWith("impfung");
    });

    it("defaults to empty string when no param given", async () => {
      jest.spyOn(PruefpunktAPI, "searchPosts").mockResolvedValue([]);

      await PruefpunktFetcher.searchFetcher({});

      expect(PruefpunktAPI.searchPosts).toHaveBeenCalledWith("");
    });

    it("sets sourceName to 'Prüfpunkt' on every returned post", async () => {
      const articles = [makeArticle()] as LoadArticlePostProperties[];
      jest.spyOn(PruefpunktAPI, "searchPosts").mockResolvedValue(articles);
      jest
        .spyOn(WordPressFetcher, "mapArticleToPost")
        .mockReturnValue(makePost() as any);

      const result = await PruefpunktFetcher.searchFetcher({ param: "test" });

      expect(result[0].data.article.sourceName).toBe("Prüfpunkt");
    });

    it("returns empty array and logs error on API failure", async () => {
      const error = new Error("search failure");
      jest.spyOn(PruefpunktAPI, "searchPosts").mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await PruefpunktFetcher.searchFetcher({ param: "x" });

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Pruefpunkt Error:", error);
    });
  });
});
