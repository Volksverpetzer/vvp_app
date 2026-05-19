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

describe("UiEmptyState", () => {
  it("renders children as text", () => {
    const { getByText } = render(
      <UiEmptyState icon={<Text>icon</Text>}>Keine Einträge</UiEmptyState>,
    );
    expect(getByText("Keine Einträge")).toBeTruthy();
  });

  it("renders the icon", () => {
    const { getByText } = render(
      <UiEmptyState icon={<Text>my-icon</Text>}>text</UiEmptyState>,
    );
    expect(getByText("my-icon")).toBeTruthy();
  });
});
