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
  /** Return `null` to render nothing for a handled failure. */
  renderError?: (error: unknown) => ReactElement | null;
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
        // A caller that supplies its own renderError has UI for this failure
        // (e.g. a link-out card for a stale embed) — that's an expected,
        // handled case, not something that belongs in the error console.
        if (renderError) {
          console.warn(_error);
        } else {
          console.error(_error);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
    // renderError is deliberately excluded: callers often pass a fresh inline
    // function each render (e.g. IframeRenderer's fallback card), and it's
    // only used for the console.warn/error choice inside the reject handler
    // above — including it would re-trigger the load on every render instead
    // of just on a real keyValue/load change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
