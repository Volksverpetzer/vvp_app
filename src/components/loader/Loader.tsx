import type { ReactElement } from "react";
import React, { useEffect, useState } from "react";
import type { ActivityIndicatorProps } from "react-native";

import UiErrorCard from "#/components/ui/UiErrorCard";
import UiSpinner from "#/components/ui/UiSpinner";
import { spacing } from "#/constants/Spacing";

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
      <UiSpinner
        {...spinnerProps}
        text={loadingText}
        containerStyle={{ minHeight: 280, paddingVertical: spacing.xxl }}
      />
    );
  }

  if (typeof data === "undefined") {
    if (error) {
      if (renderError) {
        return renderError(error);
      }
      return (
        <UiErrorCard text="Beitrag konnte nicht geladen werden. Bitte später erneut versuchen." />
      );
    }
    return null;
  }

  return render(data);
};

export default Loader;
