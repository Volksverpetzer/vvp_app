import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import UiEmptyState from "#/components/ui/UiEmptyState";

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

jest.mock("#/hooks/useAppColorScheme", () => ({
  useCorporateColor: jest.fn(() => "#1B7194"),
}));

jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { centered: {} },
}));

describe("UiEmptyState", () => {
  it("renders children as text", () => {
    const { getByText } = render(
      <UiEmptyState icon={() => <Text>icon</Text>}>
        Keine Einträge
      </UiEmptyState>,
    );
    expect(getByText("Keine Einträge")).toBeTruthy();
  });

  it("calls the icon factory with the corporate color", () => {
    const icon = jest.fn(() => <Text>icon</Text>);
    render(<UiEmptyState icon={icon}>text</UiEmptyState>);
    expect(icon).toHaveBeenCalledWith("#1B7194");
  });
});
