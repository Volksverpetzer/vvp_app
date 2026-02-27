import React, { ReactElement, useEffect, useState } from "react";

import LoadingFallback from "#/components/animations/LoadingFallback";
import ErrorCard from "#/components/design/ErrorCard";

type LoaderProps<TData> = {
  keyValue: string;
  load: (keyValue: string) => Promise<TData>;
  render: (data: TData) => ReactElement;
  renderError?: (error: unknown) => ReactElement;
  onLoaded?: (data: TData) => void;
  loadingText?: string;
};

const Loader = <TData,>({
  keyValue,
  load,
  render,
  renderError,
  onLoaded,
  loadingText = "Lade Beitrag...",
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

        onLoaded?.(result);
        setData(result);
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
