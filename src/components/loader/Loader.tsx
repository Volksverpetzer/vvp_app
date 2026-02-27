import React, { ReactElement, useEffect, useState } from "react";
import type { ActivityIndicatorProps } from "react-native";

import LoadingFallback from "#/components/animations/LoadingFallback";
import ErrorCard from "#/components/design/ErrorCard";

type LoaderProps<TData> = {
  keyValue: string;
  load: (keyValue: string) => Promise<TData>;
  render: (data: TData) => ReactElement;
  renderError?: (error: unknown) => ReactElement;
  onLoaded?: (data: TData) => void;
  loadingText?: string;
  spinnerProps?: ActivityIndicatorProps;
};

const Loader = <TData,>({
  keyValue,
  load,
  render,
  renderError,
  onLoaded,
  loadingText = "Lade Beitrag...",
  spinnerProps = { size: "large" },
}: LoaderProps<TData>) => {
  const [data, setData] = useState<TData>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setData(undefined);
    setError(undefined);

    load(keyValue)
      .then((result: TData) => {
        if (!isMounted) {
          return;
        }

        setData(result);
        try {
          onLoaded?.(result);
        } catch (_error) {
          console.error(_error);
        }
      })
      .catch((_error) => {
        if (isMounted) {
          setError(_error);
        }
        console.error(_error);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [keyValue, load, onLoaded]);

  if (isLoading) {
    return (
      <LoadingFallback
        text={loadingText}
        spinnerProps={spinnerProps}
        containerStyle={{
          height: undefined,
          minHeight: 280,
          paddingVertical: 24,
        }}
      />
    );
  }

  if (typeof data === "undefined") {
    if (error) {
      if (renderError) {
        return renderError(error);
      }
      return (
        <ErrorCard
          text={"Beitrag konnte nicht geladen werden. Bitte erneut versuchen."}
        />
      );
    }
    return null;
  }

  return render(data);
};

export default Loader;
