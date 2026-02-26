import { describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";

import Feed from "#/screens/Home/components/Feed";
import FetcherUtilities from "#/screens/Home/fetchers/FetcherUtilities";

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("#/components/Icons", () => ({
  SearchIcon: () => null,
  SettingsIcon: () => null,
}));

jest.mock("#/components/animations/UiSpinner", () => () => null);
jest.mock("#/components/design/EmptyComponent", () => () => null);
jest.mock("#/components/posts/GenericPost", () => () => null);
jest.mock("#/components/design/Text", () => {
  const { Text } = require("react-native");
  return ({ children }: any) => <Text>{children}</Text>;
});
jest.mock("#/components/design/View", () => {
  const { View } = require("react-native");
  return ({ children }: any) => <View>{children}</View>;
});
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
}));
jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { corporate: "#000", secondaryBackground: "#fff" },
    dark: { corporate: "#000", secondaryBackground: "#fff" },
  },
}));
jest.mock("#/constants/Styles", () => ({
  styles: {
    feed: {},
    centered: {},
    heading: {},
  },
}));

jest.mock("#/screens/Home/fetchers/FetcherUtilities", () => ({
  __esModule: true,
  default: {
    fetchAndProcessPosts: jest.fn(),
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

describe("Feed AbortController behavior", () => {
  it("aborts the previous fetch pipeline request when a new load starts", async () => {
    const d1 = deferred<any[]>();
    const d2 = deferred<any[]>();
    const fetchAndProcessPosts = (FetcherUtilities as any)
      .fetchAndProcessPosts as jest.Mock;

    fetchAndProcessPosts
      .mockImplementationOnce(() => d1.promise)
      .mockImplementationOnce(() => d2.promise);

    const fetcher = jest.fn(async () => []);
    const { rerender, unmount } = render(
      <Feed fetchers={[{ fetcher, props: {} }]} />,
    );

    await waitFor(() => expect(fetchAndProcessPosts).toHaveBeenCalledTimes(1));
    const firstSignal = fetchAndProcessPosts.mock.calls[0][1]
      .signal as AbortSignal;

    rerender(
      <Feed
        fetchers={[
          { fetcher, props: {} },
          { fetcher, props: {} },
        ]}
      />,
    );

    await waitFor(() => expect(fetchAndProcessPosts).toHaveBeenCalledTimes(2));
    const secondSignal = fetchAndProcessPosts.mock.calls[1][1]
      .signal as AbortSignal;

    expect(firstSignal).not.toBe(secondSignal);
    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal.aborted).toBe(false);

    unmount();

    await act(async () => {
      d1.resolve([]);
      d2.resolve([]);
      await Promise.resolve();
    });
  });
});
