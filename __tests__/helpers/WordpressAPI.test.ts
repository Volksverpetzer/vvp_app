import { describe, expect, it, jest } from "@jest/globals";

import WordpressAPI from "#/helpers/network/WordpressAPI";
import * as Networking from "#/helpers/utils/networking";

describe("WordpressAPI", () => {
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
      const result = await WordpressAPI.getPosts(2);

      // We don't test the exact timestamp value since it's dynamic
      // but we verify the structure of the call
      expect(spy).toHaveBeenCalledWith(
        WordpressAPI["client"],
        `/wp-json/wp/v2/posts`,
        expect.objectContaining({
          params: expect.objectContaining({
            per_page: 10,
            page: 2,
            orderby: "date",
            order: "desc",
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
      const result = await WordpressAPI.searchPosts(term);
      expect(spy).toHaveBeenCalledWith(
        WordpressAPI["client"],
        `/wp-json/wp/v2/posts`,
        {
          params: {
            orderby: "relevance",
            search: encodeURIComponent(term),
            page: 10,
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
      const result = await WordpressAPI.getPost("slug");
      expect(spy).toHaveBeenCalledWith(
        WordpressAPI["client"],
        `/wp-json/wp/v2/posts`,
        {
          params: {
            slug: encodeURIComponent("slug"),
          },
        },
      );
      expect(result).toBe(item);
      spy.mockRestore();
    });

    it("returns null when data is empty", async () => {
      const spy = jest.spyOn(Networking, "get").mockResolvedValue([] as any);
      const result = await WordpressAPI.getPost("slug");
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
      const { image, thumb } = await WordpressAPI.getFeatureImage("href");
      expect(image).toBe("mlarge");
      expect(thumb).toBe("thumb");
      spy.mockRestore();
    });
  });

  describe("convertLoadProps", () => {
    it("decodes title and sets description", () => {
      const data = {
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
        authors: [],
      } as any;
      const article = WordpressAPI.convertLoadProps(data);
      expect(article.title).toBe("Hello & World");
      expect(article.description).toBe("Desc");
      expect(article._links).toBe(data._links);
    });
  });
});
