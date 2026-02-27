import React, { ReactElement, useEffect, useState } from "react";

import LoadingFallback from "#/components/animations/LoadingFallback";

type LoaderProps<TData> = {
  keyValue: string;
  load: (keyValue: string) => Promise<TData>;
  render: (data: TData) => ReactElement;
  onLoaded?: (data: TData) => void;
  loadingText?: string;
};

const Loader = <TData,>({
  keyValue,
  load,
  render,
  onLoaded,
  loadingText = "Lade Beitrag...",
}: LoaderProps<TData>) => {
  const [data, setData] = useState<TData>();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setData(undefined);

    load(keyValue)
      .then((result: TData) => {
        if (!isMounted) {
          return;
        }

        onLoaded?.(result);
        setData(result);
      })
      .catch((error) => console.error(error))
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

  if (!data) {
    return null;
  }

  return render(data);
};

export default Loader;
