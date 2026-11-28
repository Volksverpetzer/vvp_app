import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";
import { useEffect } from "react";
import { Platform, Text } from "react-native";

import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import { toXUrl, useAISearch } from "#/hooks/useAISearch";
import type { AISearchResponse } from "#/types";

jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://example.com" },
}));

jest.mock("#/helpers/network/IntelligenceAPI", () => ({
  __esModule: true,
  default: { vectorSearch: jest.fn() },
}));

const vectorSearch = jest.mocked(IntelligenceAPI.vectorSearch);

const mockSetResultsLength = jest.fn();
const mockSetIsLoading = jest.fn();

let reloadRef: (() => void) | null = null;

const Harness = ({ search }: { search: string }) => {
  const { error, reload } = useAISearch({
    search,
    setResultsLength: mockSetResultsLength,
    setIsLoading: mockSetIsLoading,
  });
  useEffect(() => {
    reloadRef = reload;
  }, [reload]);
  return <Text testID="error">{error}</Text>;
};

const setPlatformOS = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
};

const response = (body: {
  ok: boolean;
  status?: number;
  json?: unknown;
  text?: string;
}) =>
  Promise.resolve({
    ok: body.ok,
    status: body.status ?? (body.ok ? 200 : 404),
    json: () => Promise.resolve(body.json),
    text: () => Promise.resolve(body.text ?? ""),
  });

const originalOS = Platform.OS;
const originalFetch = globalThis.fetch;

afterEach(() => {
  jest.clearAllMocks();
  setPlatformOS(originalOS);
  globalThis.fetch = originalFetch;
  reloadRef = null;
});

describe("toXUrl", () => {
  it.each([
    "https://x.com/user/status/1",
    "https://twitter.com/user/status/1",
    "https://mobile.x.com/user/status/1",
    "HTTPS://X.COM/user/status/1",
  ])("accepts %s", (url) => {
    expect(toXUrl(url)).toBe(url);
  });

  it("adds https to a link typed without scheme", () => {
    expect(toXUrl(" x.com/user/status/1 ")).toBe("https://x.com/user/status/1");
  });

  it.each([
    "https://www.fox.com/title/1",
    "https://dropbox.com/s/abc",
    "https://linux.com",
    "https://x.com.evil.example/status/1",
    "fox.com",
    "was ist x.com",
    "ftp://x.com/file",
  ])("rejects %s", (input) => {
    expect(toXUrl(input)).toBeNull();
  });
});

describe("useAISearch — fetching pasted links", () => {
  it("does not send other domains containing x.com to the oEmbed API", async () => {
    setPlatformOS("ios");
    const fetchMock = jest.fn((_url: string) =>
      response({ ok: true, text: "<p>Serie</p>" }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    vectorSearch.mockResolvedValue([] as AISearchResponse[]);

    await render(<Harness search="https://www.fox.com/title/1" />);

    await waitFor(() => expect(vectorSearch).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("https://www.fox.com/title/1");
    expect(vectorSearch.mock.calls[0][0]).toBe("Serie");
  });

  it("encodes the post link in the oEmbed URL", async () => {
    const fetchMock = jest.fn((_url: string) =>
      response({ ok: true, json: { html: "<p>Tweet text</p>" } }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    vectorSearch.mockResolvedValue([] as AISearchResponse[]);
    const link = "https://x.com/user/status/1?s=20&t=abc#m";

    await render(<Harness search={link} />);

    await waitFor(() => expect(vectorSearch).toHaveBeenCalled());
    const requested = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requested.host).toBe("publish.x.com");
    expect(requested.searchParams.get("url")).toBe(link);
    expect(vectorSearch.mock.calls[0][0]).toBe("Tweet text");
  });

  it("shows an error instead of searching when the oEmbed API fails", async () => {
    globalThis.fetch = jest.fn(() =>
      response({ ok: false, json: { error: "not found" } }),
    ) as unknown as typeof fetch;

    const { getByTestId } = await render(
      <Harness search="https://x.com/user/status/1" />,
    );

    await waitFor(() =>
      expect(getByTestId("error").props.children).toBe(
        "Fehler beim Laden der Vorschau",
      ),
    );
    expect(vectorSearch).not.toHaveBeenCalled();
    expect(mockSetResultsLength).toHaveBeenLastCalledWith(0);
  });

  it.each([
    ["empty", { html: "" }],
    ["missing", {}],
    ["tag-only", { html: "<blockquote><p> </p></blockquote>" }],
  ])(
    "shows an error instead of searching when the oEmbed html is %s",
    async (_label, json) => {
      globalThis.fetch = jest.fn(() =>
        response({ ok: true, json }),
      ) as unknown as typeof fetch;

      const { getByTestId } = await render(
        <Harness search="https://x.com/user/status/1" />,
      );

      await waitFor(() =>
        expect(getByTestId("error").props.children).toBe(
          "Fehler beim Laden der Vorschau",
        ),
      );
      expect(vectorSearch).not.toHaveBeenCalled();
      expect(mockSetResultsLength).toHaveBeenLastCalledWith(0);
    },
  );

  it("shows an error instead of searching an error page", async () => {
    setPlatformOS("ios");
    globalThis.fetch = jest.fn(() =>
      response({ ok: false, text: "<h1>404 Not Found</h1>" }),
    ) as unknown as typeof fetch;

    const { getByTestId } = await render(
      <Harness search="https://news.example.org/weg" />,
    );

    await waitFor(() =>
      expect(getByTestId("error").props.children).toBe(
        "Fehler beim Laden der Seite",
      ),
    );
    expect(vectorSearch).not.toHaveBeenCalled();
  });
});

describe("useAISearch — reload and unmount", () => {
  it("aborts a reload request when the screen is left", async () => {
    let resolveReload!: (value: AISearchResponse[]) => void;
    vectorSearch
      .mockResolvedValueOnce([] as AISearchResponse[])
      .mockImplementationOnce(
        () =>
          new Promise<AISearchResponse[]>((resolve) => {
            resolveReload = resolve;
          }),
      );

    const { unmount } = await render(<Harness search="Impfung" />);
    await waitFor(() => expect(vectorSearch).toHaveBeenCalledTimes(1));

    await act(async () => {
      reloadRef?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(vectorSearch).toHaveBeenCalledTimes(2));
    const reloadSignal = vectorSearch.mock.calls[1][1] as AbortSignal;

    mockSetResultsLength.mockClear();
    await unmount();
    expect(reloadSignal.aborted).toBe(true);

    await act(async () => {
      resolveReload([
        { title: "Alt", text: "stale", url: "https://example.com/1" },
      ] as AISearchResponse[]);
      await Promise.resolve();
    });
    expect(mockSetResultsLength).not.toHaveBeenCalled();
  });
});
