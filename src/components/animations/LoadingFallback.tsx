import React from "react";
import { ActivityIndicatorProps } from "react-native";

import UiSpinner from "#/components/animations/UiSpinner";
import Text from "#/components/design/Text";
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
    <View
      style={{
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        gap: 20,
      }}
    >
      <UiSpinner
        {...spinnerProps}
        containerStyle={{ flex: 0, alignSelf: "center" }}
      />
      <Text style={{ textAlign: "center" }}>{text}</Text>
    </View>
  );
};

export default LoadingFallback;
