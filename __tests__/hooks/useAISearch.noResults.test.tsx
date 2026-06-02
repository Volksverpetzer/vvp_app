import { describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import { useAISearch } from "#/hooks/useAISearch";
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

const mockSetResultsLength = jest.fn();
const mockSetIsLoading = jest.fn();

const vectorSearch = jest.mocked(IntelligenceAPI.vectorSearch);

const Harness = ({ search }: { search: string }) => {
  const { results, noResults } = useAISearch({
    search,
    setResultsLength: mockSetResultsLength,
    setIsLoading: mockSetIsLoading,
  });
  return (
    <>
      <Text testID="count">{results.length}</Text>
      {noResults && <Text testID="no-results">no-results</Text>}
    </>
  );
};

describe("useAISearch — noResults", () => {
  beforeEach(() => jest.clearAllMocks());

  it("noResults is false while loading", () => {
    vectorSearch.mockReturnValue(new Promise(() => {}));
    const { queryByTestId } = render(<Harness search="test" />);
    expect(queryByTestId("no-results")).toBeNull();
  });

  it("noResults becomes true when vectorSearch returns an empty array", async () => {
    vectorSearch.mockResolvedValue([] as AISearchResponse[]);
    const { queryByTestId } = render(<Harness search="leer" />);
    await waitFor(() => expect(queryByTestId("no-results")).not.toBeNull());
  });

  it("noResults is false when vectorSearch returns results", async () => {
    vectorSearch.mockResolvedValue([
      { title: "Hit", text: "body", url: "https://example.com/1" },
    ]);
    const { queryByTestId } = render(<Harness search="treffer" />);
    await waitFor(() => expect(queryByTestId("count").props.children).toBe(1));
    expect(queryByTestId("no-results")).toBeNull();
  });

  it("noResults resets to false when a new search starts", async () => {
    vectorSearch
      .mockResolvedValueOnce([] as AISearchResponse[])
      .mockReturnValueOnce(new Promise(() => {}));

    const { queryByTestId, rerender } = render(<Harness search="leer" />);
    await waitFor(() => expect(queryByTestId("no-results")).not.toBeNull());

    await act(async () => {
      rerender(<Harness search="neu" />);
    });

    expect(queryByTestId("no-results")).toBeNull();
  });
});
