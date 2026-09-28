import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import { onLinkPress } from "#/helpers/Linking";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import WpSearchResults from "#/screens/Search/components/WpSearch";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("#/helpers/Linking", () => ({ onLinkPress: jest.fn() }));

jest.mock("#/helpers/network/WordPressAPI", () => ({
  __esModule: true,
  default: { searchPosts: jest.fn() },
}));

jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { container: {} },
}));
jest.mock("#/constants/Spacing", () => ({ spacing: { xl: 16 } }));
jest.mock("#/components/Icons", () => ({ SearchIcon: () => null }));
jest.mock("#/components/buttons/BackToTopButton", () => {
  const { Pressable } = require("react-native");
  return ({ onPress }: any) => (
    <Pressable testID="back-to-top" onPress={onPress} />
  );
});
jest.mock("#/hooks/useBackToTop", () => ({
  useBackToTop: () => ({ onScroll: jest.fn(), visible: false }),
}));
jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return ({ children }: any) => <Text>{children}</Text>;
});
jest.mock("#/components/ui/UiSpinner", () => {
  const { Text } = require("react-native");
  return ({ text }: any) => <Text testID="spinner">{text}</Text>;
});
jest.mock("#/components/ui/UiEmptyState", () => {
  const { Text } = require("react-native");
  return ({ children }: any) => <Text testID="empty">{children}</Text>;
});
jest.mock("#/components/ui/UiErrorCard", () => {
  const { Text } = require("react-native");
  return ({ text }: any) => <Text testID="error">{text}</Text>;
});

// Expose what the row receives instead of rendering HTML
jest.mock("#/screens/Search/components/SearchResultItem", () => {
  const { Pressable, Text } = require("react-native");
  return ({ title, text, onPress }: any) => (
    <Pressable testID="result" onPress={onPress}>
      <Text testID="result-title">{title}</Text>
      <Text testID="result-text">{text}</Text>
    </Pressable>
  );
});

const searchPosts = WordPressAPI.searchPosts as jest.Mock;

const post = (over: Record<string, unknown> = {}) => ({
  id: 1,
  link: "https://www.mimikama.org/mein-artikel/",
  date_gmt: "2026-09-28T04:05:00",
  title: { rendered: "Titel &amp; Mehr" },
  excerpt: { rendered: "<p>Ein Auszug mit <b>Markup</b> [&hellip;]</p>" },
  ...over,
});

const renderSearch = async (
  searchString: string,
  onResultsLength = jest.fn(),
) => {
  const utils = await render(
    <WpSearchResults
      searchString={searchString}
      onResultsLength={onResultsLength}
    />,
  );
  return { ...utils, onResultsLength };
};

// Let the 300ms debounce elapse
const flushDebounce = () => act(() => jest.advanceTimersByTimeAsync(300));

describe("WpSearchResults", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it("does not search for queries under 2 characters", async () => {
    const { queryByTestId } = await renderSearch("a");
    await flushDebounce();
    expect(searchPosts).not.toHaveBeenCalled();
    expect(queryByTestId("spinner")).toBeNull();
    expect(queryByTestId("empty")).toBeNull();
  });

  it("debounces, shows results and reports the count", async () => {
    searchPosts.mockResolvedValue([post(), post({ id: 2 })]);
    const { getByTestId, getAllByTestId, onResultsLength } =
      await renderSearch("betrug");

    expect(getByTestId("spinner")).toBeTruthy();
    expect(searchPosts).not.toHaveBeenCalled();
    await flushDebounce();

    await waitFor(() => expect(getAllByTestId("result")).toHaveLength(2));
    expect(searchPosts).toHaveBeenCalledWith(
      "betrug",
      1,
      expect.any(AbortSignal),
    );
    expect(onResultsLength).toHaveBeenCalledWith(2);
    // Entities decoded in the title
    expect(getAllByTestId("result-title")[0].props.children).toBe(
      "Titel & Mehr",
    );
  });

  it("shows the excerpt as plain text ending in an ellipsis", async () => {
    searchPosts.mockResolvedValue([post()]);
    const { getByTestId } = await renderSearch("auszug");
    await flushDebounce();
    await waitFor(() => getByTestId("result-text"));
    // Markup stripped, WordPress' own "[…]" marker replaced by "..."
    expect(getByTestId("result-text").props.children).toBe(
      "<p>Ein Auszug mit Markup...</p>",
    );
  });

  it("truncates long excerpts at a word boundary", async () => {
    const long = "wort ".repeat(100);
    searchPosts.mockResolvedValue([post({ excerpt: { rendered: long } })]);
    const { getByTestId } = await renderSearch("wort");
    await flushDebounce();
    await waitFor(() => getByTestId("result-text"));
    const text = getByTestId("result-text").props.children as string;
    expect(text.endsWith("wort...</p>")).toBe(true);
    expect(text.length).toBeLessThan(230);
  });

  it("falls back to the Yoast description and escapes HTML", async () => {
    searchPosts.mockResolvedValue([
      post({
        excerpt: { rendered: "" },
        yoast_head_json: { description: "a < b & c" },
      }),
    ]);
    const { getByTestId } = await renderSearch("yoast");
    await flushDebounce();
    await waitFor(() => getByTestId("result-text"));
    expect(getByTestId("result-text").props.children).toBe(
      "<p>a &lt; b &amp; c...</p>",
    );
  });

  it("renders an empty paragraph when there is no excerpt at all", async () => {
    searchPosts.mockResolvedValue([post({ excerpt: undefined })]);
    const { getByTestId } = await renderSearch("leer");
    await flushDebounce();
    await waitFor(() => getByTestId("result-text"));
    expect(getByTestId("result-text").props.children).toBe("<p></p>");
  });

  it("opens the article via onLinkPress when a result is tapped", async () => {
    searchPosts.mockResolvedValue([post()]);
    const { getByTestId } = await renderSearch("tap");
    await flushDebounce();
    await waitFor(() => getByTestId("result"));
    await fireEvent.press(getByTestId("result"));
    expect(onLinkPress).toHaveBeenCalledWith(
      "https://www.mimikama.org/mein-artikel/",
      expect.objectContaining({ push: mockPush }),
    );
  });

  it("shows the empty state when nothing matches", async () => {
    searchPosts.mockResolvedValue([]);
    const { getByTestId, onResultsLength } = await renderSearch("nichts");
    await flushDebounce();
    await waitFor(() => expect(getByTestId("empty")).toBeTruthy());
    expect(onResultsLength).toHaveBeenCalledWith(0);
  });

  it("shows an error card when the request fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    searchPosts.mockRejectedValue(new Error("boom"));
    const { getByTestId, onResultsLength } = await renderSearch("fehler");
    await flushDebounce();
    await waitFor(() => expect(getByTestId("error")).toBeTruthy());
    expect(onResultsLength).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("aborts the in-flight request when the query changes", async () => {
    searchPosts.mockImplementation(
      (_q: string, _p: number, signal: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { rerender, queryByTestId } = await renderSearch("erste");
    await flushDebounce();
    const signal = searchPosts.mock.calls[0][2] as AbortSignal;

    await rerender(<WpSearchResults searchString="zweite" />);
    expect(signal.aborted).toBe(true);
    // The aborted request must not surface as an error
    expect(queryByTestId("error")).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("ignores a response that arrives after the query changed", async () => {
    let resolveFirst: (posts: unknown[]) => void = () => {};
    searchPosts.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    searchPosts.mockResolvedValueOnce([post({ id: 9 })]);
    const onResultsLength = jest.fn();
    const { rerender, getAllByTestId } = await renderSearch(
      "erste",
      onResultsLength,
    );
    await flushDebounce();

    await rerender(
      <WpSearchResults
        searchString="zweite"
        onResultsLength={onResultsLength}
      />,
    );
    await flushDebounce();
    await waitFor(() => expect(getAllByTestId("result")).toHaveLength(1));

    // The stale first response must not overwrite the newer results
    await act(async () => resolveFirst([post(), post({ id: 2 })]));
    expect(getAllByTestId("result")).toHaveLength(1);
    expect(onResultsLength).toHaveBeenCalledTimes(1);
  });

  it("scrolls the list back to the top", async () => {
    searchPosts.mockResolvedValue([post()]);
    const { getByTestId } = await renderSearch("scroll");
    await flushDebounce();
    await waitFor(() => getByTestId("back-to-top"));
    await fireEvent.press(getByTestId("back-to-top"));
  });
});
