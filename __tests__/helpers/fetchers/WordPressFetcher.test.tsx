import Post from "#/helpers/Post";
import type WordPressAPIClass from "#/helpers/network/WordPressAPI";
import { WordPressFetcher } from "#/screens/Home/fetchers/WordPressFetcher";
import type { LoadArticlePostProperties } from "#/types";

jest.mock("#/helpers/network/WordPressAPI", () => {
  const actual = jest.requireActual<{
    default: typeof WordPressAPIClass;
  }>("#/helpers/network/WordPressAPI");
  return {
    __esModule: true,
    default: {
      convertLoadProps: actual.default.convertLoadProps,
      getPosts: jest.fn(),
      searchPosts: jest.fn(),
    },
  };
});

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

  const makeArticle = (overrides: Partial<LoadArticlePostProperties> = {}) => ({
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

  describe("mapArticleToPost", () => {
    beforeEach(() => {
      (Post as jest.Mock).mockClear();
    });

    const getAuthors = () =>
      (Post as jest.Mock).mock.calls[0][3].article.authors;

    it("uses article.authors when present and non-empty", () => {
      const authors = [{ display_name: "Anna", slug: "anna" }];
      WordPressFetcher.mapArticleToPost(
        makeArticle({ authors }) as LoadArticlePostProperties,
        0,
      );
      expect(getAuthors()).toEqual(authors);
    });

    it("maps _embedded.author when article.authors is absent", () => {
      WordPressFetcher.mapArticleToPost(
        makeArticle({
          _embedded: { author: [{ name: "Bob", slug: "bob" }] },
        }) as LoadArticlePostProperties,
        0,
      );
      expect(getAuthors()).toEqual([{ display_name: "Bob", slug: "bob" }]);
    });

    it("falls back to empty array when neither authors nor _embedded.author is present", () => {
      WordPressFetcher.mapArticleToPost(
        makeArticle() as LoadArticlePostProperties,
        0,
      );
      expect(getAuthors()).toEqual([]);
    });
  });

  describe("createFetchers", () => {
    const mockApi = {
      getPosts: jest.fn(),
      searchPosts: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      // Make mapArticleToPost return a post with a real data.article so stamp() can write sourceName.
      jest
        .spyOn(WordPressFetcher, "mapArticleToPost")
        .mockImplementation(
          (article) => ({ data: { article: { ...article } } }) as any,
        );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns feedFetcher and searchFetcher functions", () => {
      const { feedFetcher, searchFetcher } =
        WordPressFetcher.createFetchers(mockApi);
      expect(typeof feedFetcher).toBe("function");
      expect(typeof searchFetcher).toBe("function");
    });

    it("feedFetcher calls the provided api.getPosts", async () => {
      mockApi.getPosts.mockResolvedValue([makeArticle({})]);
      const { feedFetcher } = WordPressFetcher.createFetchers(mockApi);
      await feedFetcher({ page: 2 });
      expect(mockApi.getPosts).toHaveBeenCalledWith(2);
    });

    it("searchFetcher calls the provided api.searchPosts", async () => {
      mockApi.searchPosts.mockResolvedValue([makeArticle({})]);
      const { searchFetcher } = WordPressFetcher.createFetchers(mockApi);
      await searchFetcher({ param: "test" });
      expect(mockApi.searchPosts).toHaveBeenCalledWith("test", 1);
    });

    it("searchFetcher forwards page to api.searchPosts", async () => {
      mockApi.searchPosts.mockResolvedValue([makeArticle({})]);
      const { searchFetcher } = WordPressFetcher.createFetchers(mockApi);
      await searchFetcher({ param: "test", page: 3 });
      expect(mockApi.searchPosts).toHaveBeenCalledWith("test", 3);
    });

    it("stamps sourceName on every post when provided", async () => {
      mockApi.getPosts.mockResolvedValue([
        makeArticle({ id: 1 }),
        makeArticle({ id: 2 }),
      ]);
      const { feedFetcher } = WordPressFetcher.createFetchers(
        mockApi,
        "TestSource",
      );
      const result = await feedFetcher({ page: 1 });
      expect(
        result.every((p) => p.data.article.sourceName === "TestSource"),
      ).toBe(true);
    });

    it("does not set sourceName when not provided", async () => {
      mockApi.getPosts.mockResolvedValue([makeArticle({})]);
      const { feedFetcher } = WordPressFetcher.createFetchers(mockApi);
      const result = await feedFetcher({ page: 1 });
      expect(result[0].data.article.sourceName).toBeUndefined();
    });
  });
});
