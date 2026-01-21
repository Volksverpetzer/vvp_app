import type Post from "../../../src/helpers/Post";
import FetcherUtilities from "../../../src/screens/Home/fetchers/FetcherUtilities";
import { SafeFetchFunction } from "../../../src/types";

describe("FetcherUtils", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("safeFetch", () => {
    it("returns fetched data when fetchFn resolves", async () => {
      const fetchFunction: SafeFetchFunction<string> = jest.fn(async () => [
        "a",
        "b",
      ]);
      const result = await FetcherUtilities.safeFetch(
        fetchFunction,
        "testFetcher",
      );
      expect(result).toEqual(["a", "b"]);
      expect(fetchFunction).toHaveBeenCalled();
    });

    it("returns empty array and logs error when fetchFn throws", async () => {
      const error = new Error("fail");
      const fetchFunction: SafeFetchFunction<string> = jest.fn(async () => {
        throw error;
      });
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await FetcherUtilities.safeFetch(
        fetchFunction,
        "fetcherName",
      );

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Fetch error in fetcherName"),
        error,
      );
    });
  });

  describe("sortByDatetime", () => {
    it("orders posts by descending datetime", () => {
      const older = {
        datetime: "2021-01-01T00:00:00Z",
      } as unknown as Post<unknown>;
      const newer = {
        datetime: "2021-01-02T00:00:00Z",
      } as unknown as Post<unknown>;
      expect(FetcherUtilities.sortByDatetime(older, newer)).toBeGreaterThan(0);
      expect(FetcherUtilities.sortByDatetime(newer, older)).toBeLessThan(0);
    });
  });

  describe("sortByPriority", () => {
    it("orders by descending priority when different", () => {
      const low = {
        priority: 1,
        datetime: "2021-01-01T00:00:00Z",
      } as Post<unknown>;
      const high = {
        priority: 2,
        datetime: "2021-01-02T00:00:00Z",
      } as unknown as Post<unknown>;
      expect(FetcherUtilities.sortByPriority(low, high)).toBeGreaterThan(0);
    });

    it("falls back to datetime when priorities are equal", () => {
      const p1Older = {
        priority: 1,
        datetime: "2021-01-01T00:00:00Z",
      } as unknown as Post<unknown>;
      const p1Newer = {
        priority: 1,
        datetime: "2021-01-02T00:00:00Z",
      } as unknown as Post<unknown>;
      expect(FetcherUtilities.sortByPriority(p1Older, p1Newer)).toBeGreaterThan(
        0,
      );
    });
  });

  describe("removeDuplicates", () => {
    it("removes posts with missing id or datetime and logs warning", () => {
      const valid = {
        id: "1",
        datetime: "2021-01-01T00:00:00Z",
      } as unknown as Post<unknown>;
      const missingId = {
        datetime: "2021-01-02T00:00:00Z",
      } as unknown as Post<unknown>;
      const missingDate = { id: "2" } as unknown as Post<unknown>;
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = FetcherUtilities.removeDuplicates([
        valid,
        missingId,
        missingDate,
      ]);

      expect(result).toEqual([valid]);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });

    it("removes duplicate ids after the first occurrence", () => {
      const p1a = {
        id: "1",
        datetime: "2021-01-01T00:00:00Z",
      } as unknown as Post<unknown>;
      const p1b = {
        id: "1",
        datetime: "2021-01-02T00:00:00Z",
      } as unknown as Post<unknown>;
      const p2 = {
        id: "2",
        datetime: "2021-01-03T00:00:00Z",
      } as unknown as Post<unknown>;

      const result = FetcherUtilities.removeDuplicates([p1a, p1b, p2]);

      expect(result).toEqual([p1a, p2]);
    });
  });

  describe("fetchAndProcessPosts", () => {
    const p1 = {
      id: "1",
      datetime: "2021-01-01T00:00:00Z",
      priority: 1,
    } as unknown as Post<unknown>;

    const p2 = {
      id: "2",
      datetime: "2021-01-02T00:00:00Z",
      priority: 2,
    } as unknown as Post<unknown>;
    const p3 = {
      id: "3",
      datetime: "2021-01-03T00:00:00Z",
      priority: 3,
    } as unknown as Post<unknown>;
    const p4 = {
      id: "4",
      datetime: "2021-01-04T00:00:00Z",
      priority: 4,
    } as unknown as Post<unknown>;

    it("combines, deduplicates, defaults sorts by datetime, and applies cutoffDate", async () => {
      const fetcher1 = jest.fn(async (_properties: any) => [p1, p2]);
      const fetcher2 = jest.fn(async (_properties: any) => [p3, p4]);

      const result = await FetcherUtilities.fetchAndProcessPosts(
        [
          { fetcher: fetcher1, props: {} },
          { fetcher: fetcher2, props: {} },
        ],
        {},
        [],
        { prioSort: false },
      );

      // cutoffDate default is true; threshold is max of oldest dates: max(p1, p3) => '2021-01-03' so only p3,p4
      expect(result).toEqual([p4, p3]);
    });

    it("applies prioSort and disables cutoffDate when specified", async () => {
      const fetcher1 = jest.fn(async () => [p1, p2]);
      const fetcher2 = jest.fn(async () => [p3, p4]);
      const oldPosts = [
        {
          id: "0",
          datetime: "2020-12-31T00:00:00Z",
          priority: 0,
        } as unknown as Post<unknown>,
      ];

      const result = await FetcherUtilities.fetchAndProcessPosts(
        [
          { fetcher: fetcher1, props: {} },
          { fetcher: fetcher2, props: {} },
        ],
        {},
        oldPosts,
        { prioSort: true, cutoffDate: false },
      );

      // All posts included, sorted by priority descending
      expect(result.map((p) => p.id)).toEqual(["4", "3", "2", "1", "0"]);
    });

    it("returns empty array and logs error when a fetcher throws", async () => {
      const fetcher1 = jest.fn(async () => {
        throw new Error("oops");
      });
      const fetcher2 = jest.fn(async () => [p1]);
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await FetcherUtilities.fetchAndProcessPosts([
        { fetcher: fetcher1, props: {} },
        { fetcher: fetcher2, props: {} },
      ]);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error processing posts:"),
        expect.any(Error),
      );
    });

    it("includes old posts newer than cutoffDate threshold", async () => {
      const p5: Post<unknown> = {
        id: "5",
        datetime: "2021-01-05T00:00:00Z",
        priority: 5,
      } as unknown as Post<unknown>;
      const fetcher1 = jest.fn(async () => [p1, p2]);
      const fetcher2 = jest.fn(async () => [p3, p4]);
      const result = await FetcherUtilities.fetchAndProcessPosts(
        [
          { fetcher: fetcher1, props: {} },
          { fetcher: fetcher2, props: {} },
        ],
        {},
        [p5],
      );
      expect(result.map((p) => p.id)).toEqual(["5", "4", "3"]);
    });
  });
});
