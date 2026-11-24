import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { render, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";

import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import {
  MAX_QUERY_LENGTH,
  htmlToQueryText,
  urlToQueryText,
  useAISearch,
} from "#/hooks/useAISearch";
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

const Harness = ({ search }: { search: string }) => {
  useAISearch({
    search,
    setResultsLength: mockSetResultsLength,
    setIsLoading: mockSetIsLoading,
  });
  return null;
};

const setPlatformOS = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
};

const originalOS = Platform.OS;
const originalFetch = globalThis.fetch;

describe("useAISearch — pasted URLs", () => {
  afterEach(() => {
    jest.clearAllMocks();
    setPlatformOS(originalOS);
    globalThis.fetch = originalFetch;
  });

  it("caps the page text sent to vectorSearch on native", async () => {
    setPlatformOS("ios");
    const body = `<html><head><style>p{}</style><script>var x;</script></head><body>${"<p>Wort </p>".repeat(50_000)}</body></html>`;
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({ text: () => Promise.resolve(body) }),
    ) as unknown as typeof fetch;
    vectorSearch.mockResolvedValue([] as AISearchResponse[]);

    await render(<Harness search="https://news.example.org/artikel" />);

    await waitFor(() => expect(vectorSearch).toHaveBeenCalled());
    const query = vectorSearch.mock.calls[0][0];
    expect(query.length).toBeLessThanOrEqual(MAX_QUERY_LENGTH);
    expect(query.startsWith("Wort Wort")).toBe(true);
    expect(query).not.toMatch(/var x|p\{\}/);
  });

  it("searches on the URL words on web instead of fetching the page", async () => {
    setPlatformOS("web");
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    vectorSearch.mockResolvedValue([] as AISearchResponse[]);

    await render(
      <Harness search="https://www.tagesschau.de/inland/afd-verbot-antrag-100.html" />,
    );

    await waitFor(() => expect(vectorSearch).toHaveBeenCalled());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vectorSearch.mock.calls[0][0]).toBe(
      "tagesschau.de inland afd verbot antrag",
    );
  });
});

describe("urlToQueryText", () => {
  it("decodes percent-encoded slugs", () => {
    expect(urlToQueryText("https://example.org/%C3%BCber-uns/")).toBe(
      "example.org über uns",
    );
  });

  it("falls back to the URL when the path has no words", () => {
    expect(urlToQueryText("https://example.org/?p=123")).toBe(
      "https://example.org/?p=123",
    );
  });

  it("falls back to the input when it isn't a valid URL", () => {
    expect(urlToQueryText("http//kaputt")).toBe("http//kaputt");
  });
});

describe("htmlToQueryText", () => {
  it("collapses whitespace", () => {
    expect(htmlToQueryText("<h1>Titel</h1>\n\n  <p>Text</p>")).toBe(
      "Titel Text",
    );
  });
});
