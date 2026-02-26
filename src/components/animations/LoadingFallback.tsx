import React from "react";
import { ActivityIndicatorProps } from "react-native";

import UiSpinner from "#/components/animations/UiSpinner";
import View from "#/components/design/View";
import Text from "#/components/design/Text";
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
      }}
    >
      <UiSpinner
        {...spinnerProps}
        style={[{ flex: 0, alignSelf: "center" }, spinnerProps?.style]}
      />
      <Text style={{ textAlign: "center" }}>{text}</Text>
    </View>
  );
};

export default LoadingFallback;
