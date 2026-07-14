import { describe, expect, it, jest } from "@jest/globals";

import WordPressAPI from "#/helpers/network/WordPressAPI";
import * as Networking from "#/helpers/utils/networking";

describe("WordPressAPI", () => {
  // Networking get is used under the hood
  describe("getPosts", () => {
    it("calls networking.get with correct URL", async () => {
      // Mock Date.now() to return a fixed timestamp for testing
      const mockTimestamp = 1_234_567_890;
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(mockTimestamp);
      const getTimeSpy = jest
        .spyOn(Date.prototype, "getTime")
        .mockReturnValue(mockTimestamp);

      const spy = jest
        .spyOn(Networking, "get")
        .mockResolvedValue([{ id: 1 }] as any);
      const result = await WordPressAPI.getPosts(2);

      // We don't test the exact timestamp value since it's dynamic
      // but we verify the structure of the call
      expect(spy).toHaveBeenCalledWith(
        WordPressAPI["client"],
        `/wp-json/wp/v2/posts`,
        expect.objectContaining({
          params: expect.objectContaining({
            per_page: 10,
            page: 2,
            orderby: "date",
            order: "desc",
            _embed: "author",
            _: expect.any(Number), // We expect a timestamp but don't care about its exact value
          }),
          headers: expect.objectContaining({
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          }),
        }),
      );

      expect(result).toEqual([{ id: 1 }]);

      // Restore the original Date.now
      nowSpy.mockRestore();
      getTimeSpy.mockRestore();
      spy.mockRestore();
    });
  });

  describe("searchPosts", () => {
    it("calls networking.get with correct URL", async () => {
      const term = "foo";
      const spy = jest
        .spyOn(Networking, "get")
        .mockResolvedValue([{ id: 2 }] as any);
      const result = await WordPressAPI.searchPosts(term);
      expect(spy).toHaveBeenCalledWith(
        WordPressAPI["client"],
        `/wp-json/wp/v2/posts`,
        {
          params: {
            orderby: "relevance",
            search: term,
            page: 10,
            _embed: "author",
          },
        },
      );
      expect(result).toEqual([{ id: 2 }]);
      spy.mockRestore();
    });
  });

  describe("getPost", () => {
    it("returns first item when data is non-empty", async () => {
      const item = { id: 3 };
      const spy = jest
        .spyOn(Networking, "get")
        .mockResolvedValue([item] as any);
      const result = await WordPressAPI.getPost("slug");
      expect(spy).toHaveBeenCalledWith(
        WordPressAPI["client"],
        `/wp-json/wp/v2/posts`,
        {
          params: {
            slug: "slug",
            _embed: "author",
          },
        },
      );
      expect(result).toBe(item);
      spy.mockRestore();
    });

    it("returns null when data is empty", async () => {
      const spy = jest.spyOn(Networking, "get").mockResolvedValue([] as any);
      const result = await WordPressAPI.getPost("slug");
      expect(result).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe("getFeatureImage", () => {
    it("returns correct image and thumb when sizes provided", async () => {
      const sizes = {
        medium_large: { source_url: "mlarge" },
        medium: { source_url: "med" },
        thumbnail: { source_url: "thumb" },
      };
      const spy = jest
        .spyOn(Networking, "get")
        .mockResolvedValue({ media_details: { sizes } } as any);
      const { image, thumb } = await WordPressAPI.getFeatureImage("href");
      expect(image).toBe("mlarge");
      expect(thumb).toBe("thumb");
      spy.mockRestore();
    });

    it("falls back to source_url when no intermediate sizes exist", async () => {
      // Prüfpunkt's WordPress returns an empty `sizes` object; only the
      // full-size original is available via the top-level source_url.
      const spy = jest.spyOn(Networking, "get").mockResolvedValue({
        source_url: "https://pruefpunkt.org/wp-content/uploads/full.png",
        media_details: { sizes: {} },
      } as any);
      const { image, thumb } = await WordPressAPI.getFeatureImage("href");
      expect(image).toBe("https://pruefpunkt.org/wp-content/uploads/full.png");
      expect(thumb).toBe("https://pruefpunkt.org/wp-content/uploads/full.png");
      spy.mockRestore();
    });
  });

  describe("extractImageCredit", () => {
    it("returns the credit when a source is present", () => {
      const credit = WordPressAPI.extractImageCredit({
        meta: {
          isc_image_source: "Media Tenor",
          isc_image_source_url: "https://example.com/source",
          isc_image_licence: "CC BY 4.0",
        },
      } as any);
      expect(credit).toEqual({
        source: "Media Tenor",
        sourceUrl: "https://example.com/source",
        licence: "CC BY 4.0",
      });
    });

    it("trims all fields and drops whitespace-only url/licence", () => {
      const credit = WordPressAPI.extractImageCredit({
        meta: {
          isc_image_source: "  Media Tenor  ",
          isc_image_source_url: "  https://example.com/source  ",
          isc_image_licence: "   ",
        },
      } as any);
      expect(credit).toEqual({
        source: "Media Tenor",
        sourceUrl: "https://example.com/source",
        licence: undefined,
      });
    });

    it("returns undefined when the source is empty or whitespace", () => {
      expect(
        WordPressAPI.extractImageCredit({
          meta: { isc_image_source: "   ", isc_image_source_url: "x" },
        } as any),
      ).toBeUndefined();
      expect(
        WordPressAPI.extractImageCredit({ meta: {} } as any),
      ).toBeUndefined();
      expect(WordPressAPI.extractImageCredit(undefined)).toBeUndefined();
    });
  });

  describe("getMediaCredit", () => {
    it("requests the media endpoint on the article's own origin", async () => {
      const spy = jest.spyOn(Networking, "get").mockResolvedValue({
        meta: { isc_image_source: "Media Tenor" },
      } as any);

      const credit = await WordPressAPI.getMediaCredit(
        "101850",
        "https://volksverpetzer.de/aktuelles/some-article/",
      );

      expect(spy).toHaveBeenCalledWith(
        WordPressAPI["client"],
        "https://volksverpetzer.de/wp-json/wp/v2/media/101850",
        expect.objectContaining({ params: { _fields: "meta" } }),
      );
      expect(credit).toEqual({
        source: "Media Tenor",
        sourceUrl: undefined,
        licence: undefined,
      });
      spy.mockRestore();
    });
  });

  describe("create", () => {
    it("calls createClient with the given URL", () => {
      const spy = jest.spyOn(Networking, "createClient");
      WordPressAPI.create("https://www.pruefpunkt.org");
      expect(spy).toHaveBeenCalledWith("https://www.pruefpunkt.org");
      spy.mockRestore();
    });

    it("getPosts calls networking.get with correct params", async () => {
      const mockTimestamp = 1_234_567_890;
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(mockTimestamp);
      const spy = jest
        .spyOn(Networking, "get")
        .mockResolvedValue([{ id: 1 }] as any);

      const api = WordPressAPI.create("https://www.pruefpunkt.org");
      const result = await api.getPosts(3);

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        `/wp-json/wp/v2/posts`,
        expect.objectContaining({
          params: expect.objectContaining({
            per_page: 10,
            page: 3,
            orderby: "date",
            order: "desc",
            _: mockTimestamp,
            _embed: "author",
          }),
          headers: expect.objectContaining({
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          }),
        }),
      );
      expect(result).toEqual([{ id: 1 }]);

      nowSpy.mockRestore();
      spy.mockRestore();
    });

    it("getPosts defaults to page 1", async () => {
      const spy = jest.spyOn(Networking, "get").mockResolvedValue([] as any);

      const api = WordPressAPI.create("https://www.pruefpunkt.org");
      await api.getPosts();

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        `/wp-json/wp/v2/posts`,
        expect.objectContaining({
          params: expect.objectContaining({ page: 1 }),
        }),
      );
      spy.mockRestore();
    });

    it("searchPosts calls networking.get with correct params", async () => {
      const spy = jest
        .spyOn(Networking, "get")
        .mockResolvedValue([{ id: 2 }] as any);

      const api = WordPressAPI.create("https://www.pruefpunkt.org");
      const result = await api.searchPosts("faktencheck");

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        `/wp-json/wp/v2/posts`,
        {
          params: {
            orderby: "relevance",
            search: "faktencheck",
            page: 1,
            _embed: "author",
          },
        },
      );
      expect(result).toEqual([{ id: 2 }]);
      spy.mockRestore();
    });

    it("searchPosts accepts a custom page number", async () => {
      const spy = jest.spyOn(Networking, "get").mockResolvedValue([] as any);

      const api = WordPressAPI.create("https://www.pruefpunkt.org");
      await api.searchPosts("foo", 5);

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        `/wp-json/wp/v2/posts`,
        {
          params: {
            orderby: "relevance",
            search: "foo",
            page: 5,
            _embed: "author",
          },
        },
      );
      spy.mockRestore();
    });
  });

  describe("convertLoadProps", () => {
    const baseData = {
      title: { rendered: "Hello &amp; World" },
      yoast_head_json: { description: "Desc" },
      _links: { "wp:featuredmedia": [{ href: "h" }] },
      date: "d",
      link: "l",
      description: "",
      categories: [],
      id: 4,
      slug: "s",
      date_gmt: "dg",
      content: { rendered: "c" },
    };

    it("decodes title and sets description", () => {
      const article = WordPressAPI.convertLoadProps({
        ...baseData,
        authors: [],
      } as any);
      expect(article.title).toBe("Hello & World");
      expect(article.description).toBe("Desc");
      expect(article._links).toBe(baseData._links);
    });

    it("maps _embedded.author to authors when authors is absent", () => {
      const article = WordPressAPI.convertLoadProps({
        ...baseData,
        _embedded: { author: [{ name: "Bob", slug: "bob" }] },
      } as any);
      expect(article.authors).toEqual([{ display_name: "Bob", slug: "bob" }]);
    });

    it("uses explicit authors when present and non-empty", () => {
      const authors = [{ display_name: "Anna", slug: "anna" }];
      const article = WordPressAPI.convertLoadProps({
        ...baseData,
        authors,
        _embedded: { author: [{ name: "Bob", slug: "bob" }] },
      } as any);
      expect(article.authors).toEqual(authors);
    });

    it("falls back to empty array when neither authors nor _embedded.author is present", () => {
      const article = WordPressAPI.convertLoadProps({
        ...baseData,
      } as any);
      expect(article.authors).toEqual([]);
    });

    it("preserves reading_time when present in raw data", () => {
      const article = WordPressAPI.convertLoadProps({
        ...baseData,
        reading_time: 12,
      } as any);
      expect(article.reading_time).toBe(12);
    });

    it("leaves reading_time undefined when absent from raw data", () => {
      const article = WordPressAPI.convertLoadProps({
        ...baseData,
      } as any);
      expect(article.reading_time).toBeUndefined();
    });
  });
});
