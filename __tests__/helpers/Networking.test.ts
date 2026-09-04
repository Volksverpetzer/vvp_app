import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import * as Networking from "#/helpers/utils/networking";

// Mock AbortController
(globalThis as any).AbortController = class {
  signal = {};
  abort = jest.fn();
};

// Mock fetch
(globalThis as any).fetch = jest.fn();

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn().mockImplementation(() => 123 as any) as any;
const mockClearTimeout = jest.fn() as any;

(globalThis as any).setTimeout = mockSetTimeout;
(globalThis as any).clearTimeout = mockClearTimeout;

// Mock console.error
(console.error as any) = jest.fn();

const mockJsonResponse =
  (body: unknown, status = 200) =>
  () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Error",
      text: () => Promise.resolve(JSON.stringify(body)),
      headers: new Headers(),
    } as any);

describe("Networking utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createClient sends default headers on every request", async () => {
    const client = Networking.createClient("https://example.com" as any);
    (globalThis.fetch as jest.Mock<any>).mockImplementationOnce(
      mockJsonResponse({}),
    );

    await client.request({ url: "/test" });

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Expires: "0",
        }),
      }),
    );
  });

  it("createClient merges extraHeaders into every request", async () => {
    const client = Networking.createClient("https://example.com" as any, {
      Referer: "https://example.com",
    });
    (globalThis.fetch as jest.Mock<any>).mockImplementationOnce(
      mockJsonResponse({}),
    );

    await client.request({ url: "/test" });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Referer: "https://example.com" }),
      }),
    );
  });

  it("fetchWithTimeout resolves response data", async () => {
    const client = Networking.createClient("https://x" as any);
    const fakeResponse = { data: { foo: "bar" } };
    const mockRequest = jest.fn<any>().mockResolvedValue(fakeResponse);
    client.request = mockRequest;

    const result = await Networking.fetchWithTimeout(client, "/p", {}, 1000);

    expect(result).toEqual(fakeResponse);
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/p", signal: expect.any(Object) }),
    );
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    expect(clearTimeout).toHaveBeenCalledWith(123);
  });

  it("fetchWithTimeout handles errors correctly", async () => {
    const client = Networking.createClient("https://x" as any);
    const error = new Error("Network error");
    client.request = jest.fn<any>().mockRejectedValue(error);

    await expect(Networking.fetchWithTimeout(client, "/p")).rejects.toThrow(
      "Network error",
    );
    expect(console.error).toHaveBeenCalledWith(error);
    expect(console.error).toHaveBeenCalledWith("/p");
    expect(clearTimeout).toHaveBeenCalled();
  });

  it("fetchWithTimeout uses default timeout of 60 seconds if not specified", async () => {
    const client = Networking.createClient("https://x" as any);
    client.request = jest.fn<any>().mockResolvedValue({ data: {} });

    await Networking.fetchWithTimeout(client, "/p");

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 60000);
  });

  it("fetchWithTimeout listens to external AbortSignal and aborts internal controller", async () => {
    const originalAbortController = (globalThis as any).AbortController;
    const createdControllers: any[] = [];

    class TestAbortController {
      signal = { internal: true };
      abort = jest.fn();
      constructor() {
        createdControllers.push(this);
      }
    }

    let abortListener: (() => void) | undefined;
    const externalSignal = {
      aborted: false,
      addEventListener: jest.fn((_event: string, cb: () => void) => {
        abortListener = cb;
      }),
      removeEventListener: jest.fn(),
    };

    try {
      (globalThis as any).AbortController = TestAbortController;
      const client = Networking.createClient("https://x" as any);
      const fakeResponse = { data: { ok: true } };
      const mockRequest = (jest.fn() as jest.Mock<any>).mockResolvedValue(
        fakeResponse,
      );
      client.request = mockRequest;

      const promise = Networking.fetchWithTimeout(
        client,
        "/abortable",
        { signal: externalSignal as any },
        1000,
      );

      abortListener?.();
      await promise;

      expect(createdControllers).toHaveLength(1);
      expect(createdControllers[0].abort).toHaveBeenCalled();
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          signal: createdControllers[0].signal,
        }),
      );
      expect(externalSignal.addEventListener).toHaveBeenCalledWith(
        "abort",
        expect.any(Function),
        { once: true },
      );
      expect(externalSignal.removeEventListener).toHaveBeenCalledWith(
        "abort",
        expect.any(Function),
      );
    } finally {
      (globalThis as any).AbortController = originalAbortController;
    }
  });

  it("FetchError preserves response body", async () => {
    const client = Networking.createClient("https://example.com" as any);
    (globalThis.fetch as jest.Mock<any>).mockImplementationOnce(
      mockJsonResponse({ error: "not found" }, 404),
    );

    await expect(client.request({ url: "/missing" })).rejects.toMatchObject({
      status: 404,
      body: { error: "not found" },
    });
  });

  it("fetchWithTimeout does not log when controller is already aborted", async () => {
    const originalAbortController = (globalThis as any).AbortController;
    class AbortedController {
      signal = { aborted: true };
      abort = jest.fn();
    }
    (globalThis as any).AbortController = AbortedController;

    try {
      const client = Networking.createClient("https://x" as any);
      const error = new Error("aborted");
      client.request = jest.fn<any>().mockRejectedValue(error);

      await expect(Networking.fetchWithTimeout(client, "/p")).rejects.toThrow(
        "aborted",
      );

      expect(console.error).not.toHaveBeenCalled();
    } finally {
      (globalThis as any).AbortController = originalAbortController;
    }
  });

  it("fetchWithTimeout aborts immediately when external signal is already aborted", async () => {
    const originalAbortController = (globalThis as any).AbortController;
    const abortMock = jest.fn();
    class TrackingController {
      signal = { aborted: false };
      abort = abortMock;
    }
    (globalThis as any).AbortController = TrackingController;

    const externalSignal = {
      aborted: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    try {
      const client = Networking.createClient("https://x" as any);
      client.request = jest.fn<any>().mockResolvedValue({ data: {} });

      await Networking.fetchWithTimeout(client, "/p", {
        signal: externalSignal as any,
      });

      expect(abortMock).toHaveBeenCalled();
      expect(externalSignal.addEventListener).not.toHaveBeenCalled();
    } finally {
      (globalThis as any).AbortController = originalAbortController;
    }
  });

  it("createClient resolves absolute URLs without prepending baseURL", async () => {
    const client = Networking.createClient("https://base.com" as any);
    (globalThis.fetch as jest.Mock<any>).mockImplementationOnce(
      mockJsonResponse({}),
    );

    await client.request({ url: "https://other.com/path" });

    expect(fetch).toHaveBeenCalledWith(
      "https://other.com/path",
      expect.any(Object),
    );
  });

  it("createClient skips null and undefined params but includes falsy values", async () => {
    const client = Networking.createClient("https://example.com" as any);
    (globalThis.fetch as jest.Mock<any>).mockImplementationOnce(
      mockJsonResponse({}),
    );

    await client.request({
      url: "/search",
      params: { q: "hello", skip: null, undef: undefined, page: 0 },
    });

    const calledUrl = (fetch as jest.Mock<any>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("q=hello");
    expect(calledUrl).toContain("page=0");
    expect(calledUrl).not.toContain("skip");
    expect(calledUrl).not.toContain("undef");
  });

  it("createClient serialises POST body as JSON by default", async () => {
    const client = Networking.createClient("https://example.com" as any);
    (globalThis.fetch as jest.Mock<any>).mockImplementationOnce(
      mockJsonResponse({}),
    );

    await client.request({
      url: "/items",
      method: "POST",
      data: { key: "value" },
    });

    const init = (fetch as jest.Mock<any>).mock.calls[0][1] as any;
    expect(init.body).toBe(JSON.stringify({ key: "value" }));
  });

  it("createClient passes string body as-is for POST", async () => {
    const client = Networking.createClient("https://example.com" as any);
    (globalThis.fetch as jest.Mock<any>).mockImplementationOnce(
      mockJsonResponse({}),
    );

    await client.request({ url: "/raw", method: "POST", data: "plain text" });

    const init = (fetch as jest.Mock<any>).mock.calls[0][1] as any;
    expect(init.body).toBe("plain text");
  });

  it("createClient returns raw text when responseType is text", async () => {
    const client = Networking.createClient("https://example.com" as any);
    (globalThis.fetch as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve("hello world"),
        headers: new Headers(),
      } as any),
    );

    const result = await client.request({ url: "/text", responseType: "text" });

    expect(result.data).toBe("hello world");
  });

  it("createClient parses empty response body as null", async () => {
    const client = Networking.createClient("https://example.com" as any);
    (globalThis.fetch as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 204,
        statusText: "No Content",
        text: () => Promise.resolve(""),
        headers: new Headers(),
      } as any),
    );

    const result = await client.request({ url: "/empty" });

    expect(result.data).toBeNull();
  });

  it("createClient falls back to raw text when response is not valid JSON", async () => {
    const client = Networking.createClient("https://example.com" as any);
    (globalThis.fetch as jest.Mock<any>).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve("not json {{{"),
        headers: new Headers(),
      } as any),
    );

    const result = await client.request({ url: "/broken" });

    expect(result.data).toBe("not json {{{");
  });

  it("get wrapper returns response data", async () => {
    const client = Networking.createClient("https://x" as any);
    client.request = jest.fn<any>().mockResolvedValue({ data: { id: 1 } });

    const result = await Networking.get(client, "/item");

    expect(result).toEqual({ id: 1 });
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: "/item" }),
    );
  });

  it("post wrapper sends data and returns response", async () => {
    const client = Networking.createClient("https://x" as any);
    client.request = jest.fn<any>().mockResolvedValue({ data: { ok: true } });

    const result = await Networking.post(client, "/submit", { name: "test" });

    expect(result).toEqual({ ok: true });
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: "POST", data: { name: "test" } }),
    );
  });

  it("get retries once on a transient 5xx error, then succeeds", async () => {
    const client = Networking.createClient("https://x" as any);
    const request = jest
      .fn<any>()
      .mockRejectedValueOnce(
        new Networking.FetchError("Request failed with status 500", {
          status: 500,
          statusText: "Internal Server Error",
          url: "/p",
          body: null,
        }),
      )
      .mockResolvedValueOnce({ data: { ok: true } });
    client.request = request;

    mockSetTimeout
      .mockImplementationOnce(() => 123 as any) // abort timer for attempt 1 — inert
      .mockImplementationOnce((cb: () => void) => {
        cb();
        return 999 as any;
      }); // retry delay — fire immediately

    const result = await Networking.get(client, "/p");

    expect(result).toEqual({ ok: true });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("get retries once on a network-level TypeError, then succeeds", async () => {
    const client = Networking.createClient("https://x" as any);
    const request = jest
      .fn<any>()
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockResolvedValueOnce({ data: { ok: true } });
    client.request = request;

    mockSetTimeout
      .mockImplementationOnce(() => 123 as any) // abort timer for attempt 1 — inert
      .mockImplementationOnce((cb: () => void) => {
        cb();
        return 999 as any;
      }); // retry delay — fire immediately

    const result = await Networking.get(client, "/p");

    expect(result).toEqual({ ok: true });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("get's retry delay resolves immediately when the caller's signal is already aborted, instead of waiting out the backoff", async () => {
    const client = Networking.createClient("https://x" as any);
    const error = new Networking.FetchError("Request failed with status 500", {
      status: 500,
      statusText: "Internal Server Error",
      url: "/p",
      body: null,
    });
    const request = jest.fn<any>().mockRejectedValue(error);
    client.request = request;

    const signal: any = {
      aborted: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // The retry-delay setTimeout never fires its callback here — if delay()
    // didn't short-circuit on an already-aborted signal, this would hang
    // forever instead of rejecting.
    mockSetTimeout.mockImplementation(() => 123 as any);

    await expect(Networking.get(client, "/p", { signal })).rejects.toBe(error);
    expect(request).toHaveBeenCalledTimes(3); // initial attempt + 2 retries

    mockSetTimeout.mockImplementation(() => 123 as any);
  });

  it("get does not retry a 4xx client error", async () => {
    const client = Networking.createClient("https://x" as any);
    const error = new Networking.FetchError("Request failed with status 404", {
      status: 404,
      statusText: "Not Found",
      url: "/p",
      body: null,
    });
    const request = jest.fn<any>().mockRejectedValue(error);
    client.request = request;

    await expect(Networking.get(client, "/p")).rejects.toBe(error);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("get gives up after exhausting retries on repeated 5xx errors", async () => {
    const client = Networking.createClient("https://x" as any);
    const error = new Networking.FetchError("Request failed with status 503", {
      status: 503,
      statusText: "Service Unavailable",
      url: "/p",
      body: null,
    });
    const request = jest.fn<any>().mockRejectedValue(error);
    client.request = request;

    mockSetTimeout.mockImplementation((cb: () => void, ms?: number) => {
      // Fire retry-delay timers immediately; leave anything abort-timer-sized inert.
      if (typeof ms === "number" && ms < 60000) cb();
      return 123 as any;
    });

    await expect(Networking.get(client, "/p")).rejects.toBe(error);
    expect(request).toHaveBeenCalledTimes(3); // initial attempt + 2 retries

    mockSetTimeout.mockImplementation(() => 123 as any);
  });
});
