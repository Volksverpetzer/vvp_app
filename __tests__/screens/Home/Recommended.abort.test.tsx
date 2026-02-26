import { describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";

import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import Recommended from "#/screens/Home/components/article/Recommended";

jest.mock("#/helpers/network/IntelligenceAPI", () => ({
  __esModule: true,
  default: {
    recommendations: jest.fn(),
  },
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://example.com",
  },
}));

jest.mock("#/components/design/Text", () => {
  const { Text } = require("react-native");
  return ({ children }: any) => <Text>{children}</Text>;
});
jest.mock("#/components/design/View", () => {
  const { View } = require("react-native");
  return ({ children }: any) => <View>{children}</View>;
});
jest.mock("#/components/posts/LoadArticlePost", () => () => null);
jest.mock("#/constants/Styles", () => ({
  styles: { roundEdges: {} },
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

describe("Recommended AbortController behavior", () => {
  it("aborts on unmount and suppresses logging for canceled requests", async () => {
    const d = deferred<{ results: { url: string; title: string }[] }>();
    const recommendations = (IntelligenceAPI as any)
      .recommendations as jest.Mock;
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    recommendations.mockReturnValue(d.promise);

    const { unmount } = render(
      <Recommended article_link="https://example.com/article" />,
    );

    await waitFor(() => expect(recommendations).toHaveBeenCalledTimes(1));
    const signal = recommendations.mock.calls[0][1] as AbortSignal;

    unmount();
    expect(signal.aborted).toBe(true);

    await act(async () => {
      d.reject(Object.assign(new Error("canceled"), { name: "CanceledError" }));
      await Promise.resolve();
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
