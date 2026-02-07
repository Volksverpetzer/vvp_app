import { ArticleProperties } from "#/components/posts/ArticlePost";
import Post from "#/helpers/Post";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { WordPressFetcher } from "#/screens/Home/fetchers/WordPressFetcher";

jest.mock("#/helpers/network/WordPressAPI", () => ({
  __esModule: true,
  default: {
    getPosts: jest.fn(),
    searchPosts: jest.fn(),
  },
}));

jest.mock("#/helpers/Post", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("#/components/posts/ArticlePost", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("WordPressFetcher", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const makeArticle = (overrides: Partial<ArticleProperties> = {}) => ({
    id: 3,
    date_gmt: "2021-02-03T04:05:06Z",
    link: "https://example.com/article",
    slug: "example-article",
    title: { rendered: "Hello &amp; World" },
    yoast_head_json: { description: "Desc" },
    ...overrides,
  });

  describe("wpBaseFetcher (private)", () => {
    const base = (WordPressFetcher as any).wpBaseFetcher.bind(WordPressFetcher);

    it("maps API data to Post array on success", async () => {
      const articles = [makeArticle({ id: 1 }), makeArticle({ id: 2 })];
      const api = jest.fn().mockResolvedValue(articles);
      const result = await base(api);
      expect(api).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Post);
    });

    it("returns empty array and logs error on failure", async () => {
      const error = new Error("fail");
      const api = jest.fn().mockRejectedValue(error);
      const spy = jest.spyOn(console, "error").mockImplementation();

      const result = await base(api);

      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith("WP Error:", error);
    });
  });

  describe("feedFetcher and searchFetcher", () => {
    it("calls WordPressAPI.getPosts in feedFetcher", async () => {
      const page = 2;
      const articles = [makeArticle()];
      const spy = jest
        .spyOn(WordPressAPI, "getPosts" as any)
        .mockResolvedValue(articles);

      const result = await WordPressFetcher.feedFetcher({ page });

      expect(spy).toHaveBeenCalledWith(page);
      expect(result[0]).toBeInstanceOf(Post);
    });

    it("calls WordPressAPI.searchPosts in searchFetcher", async () => {
      const parameter = "query";
      const articles = [makeArticle()];
      const spy = jest
        .spyOn(WordPressAPI, "searchPosts" as any)
        .mockResolvedValue(articles);

      const result = await WordPressFetcher.searchFetcher({ param: parameter });

      expect(spy).toHaveBeenCalledWith(parameter);
      expect(result[0]).toBeInstanceOf(Post);
    });
  });
});
