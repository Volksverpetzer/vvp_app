import React from "react";
import type {
  ActivityIndicatorProps,
  StyleProp,
  ViewStyle,
} from "react-native";

import Text from "#/components/design/Text";
import View from "#/components/design/View";
import UiSpinner from "#/components/ui/UiSpinner";

interface LoadingFallbackProps {
  text?: string;
  spinnerProps?: ActivityIndicatorProps;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Reusable loading fallback that centers a themed spinner and an optional text.
 */
const LoadingFallback = ({
  text = "Lade Artikel...",
  spinnerProps,
  containerStyle,
}: LoadingFallbackProps) => {
  return (
    <View
      style={[
        {
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          gap: 20,
        },
        containerStyle,
      ]}
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
