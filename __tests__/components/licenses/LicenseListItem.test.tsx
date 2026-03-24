import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";

import LicensesListItem from "#/screens/Settings/components/licenses/LicenseListItem";

// Mock the color scheme hook to avoid native platform differences in tests
jest.mock("#/hooks/useAppColorScheme", () => {
  const { ColorScheme } = jest.requireActual("#/hooks/useAppColorScheme");
  return { useAppColorScheme: () => ColorScheme.light };
});

describe("LicensesListItem", () => {
  it("renders the title text and has single-line truncation props", () => {
    const longPackageName = "very-long-package-name-".repeat(10);
    const username = "SomeAuthor";

    const { getByText } = render(
      <LicensesListItem packageName={longPackageName} username={username} />,
    );

    const expectedTitle = `${longPackageName} by ${username}`;

    const titleNode = getByText(expectedTitle);

    // Ensure truncation props are present on the title Text element
    expect(titleNode.props.numberOfLines).toBe(1);
    expect(titleNode.props.ellipsizeMode).toBe("tail");
  });
});
