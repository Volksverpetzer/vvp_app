import Post from "#/helpers/Post";
import type WordPressAPIClass from "#/helpers/network/WordPressAPI";
import WordPressAPI from "#/helpers/network/WordPressAPI";
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

    it("returns empty array and suppresses logging when signal is aborted", async () => {
      const controller = new AbortController();
      const error = new Error("canceled");
      const api = jest.fn().mockRejectedValue(error);
      const spy = jest.spyOn(console, "error").mockImplementation();

      controller.abort();
      const result = await base(api, controller.signal);

      expect(result).toEqual([]);
      expect(spy).not.toHaveBeenCalled();
    });

    it("passes signal to the api function", async () => {
      const controller = new AbortController();
      const articles = [makeArticle()];
      const api = jest.fn().mockResolvedValue(articles);

      await base(api, controller.signal);

      expect(api).toHaveBeenCalledWith(controller.signal);
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

  describe("feedFetcher and searchFetcher", () => {
    it("calls WordPressAPI.getPosts in feedFetcher", async () => {
      const page = 2;
      const articles = [makeArticle()];
      const spy = jest
        .spyOn(WordPressAPI, "getPosts" as any)
        .mockResolvedValue(articles);

      const result = await WordPressFetcher.feedFetcher({ page });

      expect(spy).toHaveBeenCalledWith(page, undefined);
      expect(result[0]).toBeInstanceOf(Post);
    });

    it("feedFetcher defaults to page 1 when called with no args", async () => {
      const spy = jest
        .spyOn(WordPressAPI, "getPosts" as any)
        .mockResolvedValue([]);

      await WordPressFetcher.feedFetcher();

      expect(spy).toHaveBeenCalledWith(1, undefined);
    });

    it("searchFetcher defaults to empty param when called with no args", async () => {
      const spy = jest
        .spyOn(WordPressAPI, "searchPosts" as any)
        .mockResolvedValue([]);

      await WordPressFetcher.searchFetcher();

      expect(spy).toHaveBeenCalledWith("", 10, undefined);
    });

    it("forwards AbortSignal to getPosts in feedFetcher", async () => {
      const page = 2;
      const articles = [makeArticle()];
      const controller = new AbortController();
      const spy = jest
        .spyOn(WordPressAPI, "getPosts" as any)
        .mockResolvedValue(articles);

      await WordPressFetcher.feedFetcher({ page, signal: controller.signal });

      expect(spy).toHaveBeenCalledWith(page, controller.signal);
    });

    it("calls WordPressAPI.searchPosts in searchFetcher", async () => {
      const parameter = "query";
      const articles = [makeArticle()];
      const spy = jest
        .spyOn(WordPressAPI, "searchPosts" as any)
        .mockResolvedValue(articles);

      const result = await WordPressFetcher.searchFetcher({ param: parameter });

      expect(spy).toHaveBeenCalledWith(parameter, 10, undefined);
      expect(result[0]).toBeInstanceOf(Post);
    });

    it("forwards AbortSignal to searchPosts in searchFetcher", async () => {
      const controller = new AbortController();
      const spy = jest
        .spyOn(WordPressAPI, "searchPosts" as any)
        .mockResolvedValue([]);

      await WordPressFetcher.searchFetcher({
        param: "test",
        signal: controller.signal,
      });

      expect(spy).toHaveBeenCalledWith("test", 10, controller.signal);
    });
  });
});
