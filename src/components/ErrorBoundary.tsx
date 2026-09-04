import type { PropsWithChildren } from "react";
import { Component } from "react";
import { View } from "react-native";

import UiButton from "#/components/ui/UiButton";
import UiErrorCard from "#/components/ui/UiErrorCard";
import { spacing } from "#/constants/Spacing";

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render-time errors thrown anywhere below it so the app shows a
 * recoverable fallback instead of a blank/crashed screen. Only class
 * components can implement getDerivedStateFromError/componentDidCatch.
 */
class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Unhandled render error caught by ErrorBoundary:", error);
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <UiErrorCard text="Etwas ist schiefgelaufen. Bitte versuche es erneut." />
          <UiButton label="Erneut versuchen" onPress={this.reset} />
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
