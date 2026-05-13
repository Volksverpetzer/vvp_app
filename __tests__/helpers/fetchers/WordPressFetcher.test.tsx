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
