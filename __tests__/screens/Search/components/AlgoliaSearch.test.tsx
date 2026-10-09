import { act, render, waitFor } from "@testing-library/react-native";
import React from "react";

import AlgoliaSearchResults from "#/screens/Search/components/AlgoliaSearch";

const mockSearchSingleIndex = jest.fn();
const mockSearchClient = jest.fn(() => ({
  searchSingleIndex: mockSearchSingleIndex,
}));
jest.mock("@algolia/client-search", () => ({
  searchClient: (...args: unknown[]) =>
    (mockSearchClient as (...a: unknown[]) => unknown)(...args),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    algolia: { appId: "APP", searchKey: "KEY", indexName: "INDEX" },
  },
}));

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("#/helpers/Linking", () => ({ onLinkPress: jest.fn() }));
jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { container: {} },
}));
jest.mock("#/constants/Spacing", () => ({ spacing: { xl: 16 } }));
jest.mock("#/components/Icons", () => ({ SearchIcon: jest.fn(() => null) }));
jest.mock("#/components/buttons/BackToTopButton", () => jest.fn(() => null));
jest.mock("#/hooks/useBackToTop", () => ({
  useBackToTop: () => ({ onScroll: jest.fn(), visible: false }),
}));
jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});
jest.mock("#/components/ui/UiSpinner", () => {
  const { Text } = require("react-native");
  return jest.fn(({ text }: any) => <Text testID="spinner">{text}</Text>);
});
jest.mock("#/components/ui/UiEmptyState", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text testID="empty">{children}</Text>);
});
jest.mock("#/components/ui/UiErrorCard", () => {
  const { Text } = require("react-native");
  return jest.fn(({ text }: any) => <Text testID="error">{text}</Text>);
});
jest.mock("#/screens/Search/components/SearchResultItem", () => {
  const { Text } = require("react-native");
  return jest.fn(({ title }: any) => <Text testID="result">{title}</Text>);
});

const flushDebounce = () => act(() => jest.advanceTimersByTimeAsync(300));

describe("AlgoliaSearchResults", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSearchSingleIndex.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  it("creates the client lazily from the variant's Algolia config", async () => {
    mockSearchSingleIndex.mockResolvedValue({
      hits: [
        { objectID: "1", post_title: "Treffer", post_date: 1_780_000_000 },
      ],
    });
    const onResultsLength = jest.fn();
    // Nothing is created while merely importing / for too-short queries
    await render(
      <AlgoliaSearchResults
        searchString="a"
        onResultsLength={onResultsLength}
      />,
    );
    expect(mockSearchClient).not.toHaveBeenCalled();

    const { getAllByTestId } = await render(
      <AlgoliaSearchResults
        searchString="treffer"
        onResultsLength={onResultsLength}
      />,
    );
    await flushDebounce();
    await waitFor(() => expect(getAllByTestId("result")).toHaveLength(1));

    expect(mockSearchClient).toHaveBeenCalledWith("APP", "KEY");
    expect(mockSearchSingleIndex).toHaveBeenCalledWith({
      indexName: "INDEX",
      searchParams: { query: "treffer", hitsPerPage: 10 },
    });
    expect(onResultsLength).toHaveBeenCalledWith(1);
  });

  it("shows an error card when the search fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockSearchSingleIndex.mockRejectedValue(new Error("boom"));
    const { getByTestId } = await render(
      <AlgoliaSearchResults searchString="fehler" />,
    );
    await flushDebounce();
    await waitFor(() => expect(getByTestId("error")).toBeTruthy());
    consoleError.mockRestore();
  });

  it("shows the empty state when nothing matches", async () => {
    mockSearchSingleIndex.mockResolvedValue({ hits: [] });
    const { getByTestId } = await render(
      <AlgoliaSearchResults searchString="nichts" />,
    );
    await flushDebounce();
    await waitFor(() => expect(getByTestId("empty")).toBeTruthy());
  });
});
