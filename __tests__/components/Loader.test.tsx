import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import Loader from "#/components/loader/Loader";

jest.mock("#/components/animations/LoadingFallback", () => {
  const { Text: MockText } = require("react-native");
  return function ({ text }: { text?: string }) {
    return <MockText>{`loading:${text}`}</MockText>;
  };
});

jest.mock("#/components/design/ErrorCard", () => {
  const { Text: MockText } = require("react-native");
  return function ({ text }: { text?: string }) {
    return <MockText>{`error:${text}`}</MockText>;
  };
});

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("Loader", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders loading fallback while request is pending", () => {
    const deferred = createDeferred<{ value: string }>();

    const { getByText } = render(
      <Loader
        keyValue={"id-1"}
        load={() => deferred.promise}
        render={(data) => <Text>{data.value}</Text>}
        loadingText={"Lade Test..."}
      />,
    );

    expect(getByText("loading:Lade Test...")).toBeTruthy();
  });

  it("renders loaded content and calls onLoaded on success", async () => {
    const deferred = createDeferred<{ value: string }>();
    const onLoaded = jest.fn();

    const { getByText } = render(
      <Loader
        keyValue={"id-2"}
        load={() => deferred.promise}
        render={(data) => <Text>{`data:${data.value}`}</Text>}
        onLoaded={onLoaded}
      />,
    );

    deferred.resolve({ value: "ok" });

    await waitFor(() => {
      expect(getByText("data:ok")).toBeTruthy();
    });
    expect(onLoaded).toHaveBeenCalledWith({ value: "ok" });
  });

  it("renders default error fallback when loading fails", async () => {
    const deferred = createDeferred<{ value: string }>();

    const { getByText } = render(
      <Loader
        keyValue={"id-3"}
        load={() => deferred.promise}
        render={(data) => <Text>{data.value}</Text>}
      />,
    );

    deferred.reject(new Error("boom"));

    await waitFor(() => {
      expect(
        getByText(
          "error:Beitrag konnte nicht geladen werden. Bitte erneut versuchen.",
        ),
      ).toBeTruthy();
    });
  });

  it("renders custom error UI when renderError is provided", async () => {
    const deferred = createDeferred<{ value: string }>();

    const { getByText, queryByText } = render(
      <Loader
        keyValue={"id-4"}
        load={() => deferred.promise}
        render={(data) => <Text>{data.value}</Text>}
        renderError={(error: unknown) => (
          <Text>{`custom-error:${(error as Error).message}`}</Text>
        )}
      />,
    );

    deferred.reject(new Error("custom-boom"));

    await waitFor(() => {
      expect(getByText("custom-error:custom-boom")).toBeTruthy();
    });

    expect(
      queryByText(
        "error:Beitrag konnte nicht geladen werden. Bitte erneut versuchen.",
      ),
    ).toBeNull();
  });
});
