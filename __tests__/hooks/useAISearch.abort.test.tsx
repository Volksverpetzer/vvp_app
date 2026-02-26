import { describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import { useAISearch } from "#/hooks/useAISearch";

jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://example.com",
  },
}));

jest.mock("#/helpers/network/IntelligenceAPI", () => ({
  __esModule: true,
  default: {
    vectorSearch: jest.fn(),
  },
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const HookHarness = ({ search }: { search: string }) => {
  const { results } = useAISearch({
    search,
    setResultsLength: jest.fn(),
    setIsLoading: jest.fn(),
  });
  return (
    <Text testID="titles">{results.map((item) => item.title).join(",")}</Text>
  );
};

describe("useAISearch AbortController behavior", () => {
  it("aborts the previous search request and keeps only latest results", async () => {
    const d1 = deferred<any[]>();
    const d2 = deferred<any[]>();
    const vectorSearch = (IntelligenceAPI as any).vectorSearch as jest.Mock;

    vectorSearch
      .mockImplementationOnce((_query: string, signal?: AbortSignal) => {
        return d1.promise;
      })
      .mockImplementationOnce((_query: string, signal?: AbortSignal) => {
        return d2.promise;
      });

    const { rerender, getByTestId } = render(<HookHarness search="first" />);

    rerender(<HookHarness search="second" />);

    await waitFor(() => expect(vectorSearch).toHaveBeenCalledTimes(2));
    const firstSignal = vectorSearch.mock.calls[0][1] as AbortSignal;
    const secondSignal = vectorSearch.mock.calls[1][1] as AbortSignal;

    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal.aborted).toBe(false);

    await act(async () => {
      d1.resolve([
        { title: "First", text: "stale", url: "https://example.com/1" },
      ]);
      await Promise.resolve();
    });

    expect(getByTestId("titles").props.children ?? "").toBe("");

    await act(async () => {
      d2.resolve([
        { title: "Second", text: "fresh", url: "https://example.com/2" },
      ]);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(getByTestId("titles").props.children).toContain("Second"),
    );
    expect(getByTestId("titles").props.children).not.toContain("First");
  });
});
