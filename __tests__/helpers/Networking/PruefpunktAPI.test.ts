import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import PruefpunktAPI from "#/helpers/network/PruefpunktAPI";
import * as Networking from "#/helpers/utils/networking";

jest.mock("#/helpers/utils/networking", () => ({
  __esModule: true,
  createClient: jest.fn(() => ({})),
  get: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wp2Url: "https://www.pruefpunkt.org" },
}));

describe("PruefpunktAPI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPosts", () => {
    it("calls networking.get with correct params", async () => {
      const mockTimestamp = 1_234_567_890;
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(mockTimestamp);
      const spy = jest
        .spyOn(Networking, "get")
        .mockResolvedValue([{ id: 1 }] as any);

      const result = await PruefpunktAPI.getPosts(2);

      expect(spy).toHaveBeenCalledWith(
        PruefpunktAPI["client"],
        `/wp-json/wp/v2/posts`,
        expect.objectContaining({
          params: expect.objectContaining({
            per_page: 10,
            page: 2,
            orderby: "date",
            order: "desc",
            _: mockTimestamp,
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

    it("defaults to page 1 when no page is given", async () => {
      const spy = jest.spyOn(Networking, "get").mockResolvedValue([] as any);

      await PruefpunktAPI.getPosts();

      expect(spy).toHaveBeenCalledWith(
        PruefpunktAPI["client"],
        `/wp-json/wp/v2/posts`,
        expect.objectContaining({
          params: expect.objectContaining({ page: 1 }),
        }),
      );
      spy.mockRestore();
    });
  });

  describe("searchPosts", () => {
    it("calls networking.get with correct params", async () => {
      const term = "faktencheck";
      const spy = jest
        .spyOn(Networking, "get")
        .mockResolvedValue([{ id: 2 }] as any);

      const result = await PruefpunktAPI.searchPosts(term);

      expect(spy).toHaveBeenCalledWith(
        PruefpunktAPI["client"],
        `/wp-json/wp/v2/posts`,
        { params: { orderby: "relevance", search: term, page: 10 } },
      );
      expect(result).toEqual([{ id: 2 }]);
      spy.mockRestore();
    });

    it("accepts a custom page number", async () => {
      const spy = jest.spyOn(Networking, "get").mockResolvedValue([] as any);

      await PruefpunktAPI.searchPosts("foo", 5);

      expect(spy).toHaveBeenCalledWith(
        PruefpunktAPI["client"],
        `/wp-json/wp/v2/posts`,
        { params: { orderby: "relevance", search: "foo", page: 5 } },
      );
      spy.mockRestore();
    });
  });

  describe("when wp2Url is not configured", () => {
    it("falls back to hardcoded pruefpunkt.org URL", () => {
      jest.isolateModules(() => {
        jest.doMock("#/constants/Config", () => ({
          __esModule: true,
          default: {},
        }));
        jest.doMock("#/helpers/utils/networking", () => ({
          __esModule: true,
          createClient: jest.fn(() => ({})),
          get: jest.fn(),
        }));

        require("#/helpers/network/PruefpunktAPI");

        const { createClient } =
          require("#/helpers/utils/networking") as typeof Networking;
        expect(createClient).toHaveBeenCalledWith("https://www.pruefpunkt.org");
      });
    });
  });
});
