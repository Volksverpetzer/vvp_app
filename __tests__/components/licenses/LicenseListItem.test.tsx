import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";

import LicensesListItem from "#/screens/Settings/components/licenses/LicenseListItem";

describe("LicensesListItem", () => {
  it("renders the title text and has single-line truncation props", async () => {
    const longPackageName = "very-long-package-name-".repeat(10);
    const username = "SomeAuthor";

    const { getByText } = await render(
      <LicensesListItem packageName={longPackageName} username={username} />,
    );

    const expectedTitle = `${longPackageName} by ${username}`;

    const titleNode = getByText(expectedTitle);

    // Ensure truncation props are present on the title Text element
    expect(titleNode.props.numberOfLines).toBe(1);
    expect(titleNode.props.ellipsizeMode).toBe("tail");
  });
});
