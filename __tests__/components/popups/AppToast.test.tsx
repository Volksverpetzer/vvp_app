import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import AppToast from "#/components/popups/AppToast";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

jest.mock("#/components/Icons", () => {
  const { Text } = require("react-native");
  const icon = (name: string) =>
    jest.fn(({ color }: { color: string }) => (
      <Text testID={`icon-${name}`}>{color}</Text>
    ));
  return {
    SuccessIcon: icon("success"),
    ErrorIcon: icon("error"),
    InfoIcon: icon("info"),
    TrophyIcon: icon("trophy"),
  };
});

const cardStyle = (element: { props: Record<string, any> }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

describe("AppToast", () => {
  it("shows both texts", async () => {
    const { getByText } = await render(
      <AppToast variant="success" text1="Gespeichert" text2="Alles gut" />,
    );
    expect(getByText("Gespeichert")).toBeTruthy();
    expect(getByText("Alles gut")).toBeTruthy();
  });

  it("skips a missing second line", async () => {
    const { toJSON } = await render(
      <AppToast variant="info" text1="Nur Titel" />,
    );
    expect(JSON.stringify(toJSON())).not.toContain("undefined");
  });

  it.each([
    ["success", "success", "success"],
    ["error", "error", "error"],
    ["info", "info", "primary"],
    ["achievement", "trophy", "primary"],
  ] as const)(
    "gives the %s toast its icon and accent color",
    async (variant, icon, token) => {
      const { getByTestId } = await render(
        <AppToast variant={variant} text1="Text" />,
      );
      const accent = Colors.light[token];
      expect(getByTestId(`icon-${icon}`).props.children).toBe(accent);
      expect(cardStyle(getByTestId(`toast.${variant}`)).borderLeftColor).toBe(
        accent,
      );
    },
  );

  it("follows the dark color scheme", async () => {
    jest.mocked(useAppColorScheme).mockReturnValueOnce("dark" as never);
    const { getByTestId } = await render(
      <AppToast variant="success" text1="Text" />,
    );
    expect(cardStyle(getByTestId("toast.success")).backgroundColor).toBe(
      Colors.dark.background,
    );
  });

  it("is a button only when it has an action", async () => {
    const onPress = jest.fn();
    const { getByRole, rerender, queryByRole } = await render(
      <AppToast variant="achievement" text1="Erfolg" onPress={onPress} />,
    );
    await fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(<AppToast variant="info" text1="Info" />);
    expect(queryByRole("button")).toBeNull();
  });

  it("announces errors assertively and the rest politely", async () => {
    const { getByTestId, rerender } = await render(
      <AppToast variant="error" text1="Fehler" />,
    );
    expect(getByTestId("toast.error").props.accessibilityLiveRegion).toBe(
      "assertive",
    );
    await rerender(<AppToast variant="success" text1="Ok" />);
    expect(getByTestId("toast.success").props.accessibilityLiveRegion).toBe(
      "polite",
    );
  });
});
