import React from "react";
import { ActivityIndicatorProps, Text } from "react-native";

import UiSpinner from "#/components/animations/UiSpinner";
import View from "#/components/design/View";

interface LoadingFallbackProps {
  text?: string;
  spinnerProps?: ActivityIndicatorProps;
}

/**
 * Reusable loading fallback that centers a themed spinner and an optional text.
 */
const LoadingFallback = ({
  text = "Lade Artikel...",
  spinnerProps,
}: LoadingFallbackProps) => {
  return (
    <View style={{ justifyContent: "center", height: "100%" }}>
      <UiSpinner {...spinnerProps} />
      <Text style={{ textAlign: "center" }}>{text}</Text>
    </View>
  );
};

export default LoadingFallback;
