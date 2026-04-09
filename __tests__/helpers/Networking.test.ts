import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import * as Networking from "#/helpers/utils/networking";

// Mock AbortController
(global as any).AbortController = class {
  signal = {};
  abort = jest.fn();
};

// Mock fetch
(global as any).fetch = jest.fn();

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn().mockImplementation(() => 123 as any) as any;
const mockClearTimeout = jest.fn() as any;

(global as any).setTimeout = mockSetTimeout;
(global as any).clearTimeout = mockClearTimeout;

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
    (global.fetch as jest.Mock<any>).mockImplementationOnce(
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
    (global.fetch as jest.Mock<any>).mockImplementationOnce(
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

  it("FetchError preserves response body", async () => {
    const client = Networking.createClient("https://example.com" as any);
    (global.fetch as jest.Mock<any>).mockImplementationOnce(
      mockJsonResponse({ error: "not found" }, 404),
    );

    await expect(client.request({ url: "/missing" })).rejects.toMatchObject({
      status: 404,
      body: { error: "not found" },
    });
  });
});
