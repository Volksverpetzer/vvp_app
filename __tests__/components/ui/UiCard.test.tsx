import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import UiCard from "#/components/ui/UiCard";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { CARD_PADDING } from "#/constants/GlobalStyles";

const mockColorScheme = jest.fn(() => "light");

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => mockColorScheme(),
}));

const flatten = (style: unknown): Record<string, unknown> => {
  const parts = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...parts.filter(Boolean));
};

describe("UiCard", () => {
  it("renders children", async () => {
    const { getByText } = await render(
      <UiCard>
        <Text>card body</Text>
      </UiCard>,
    );
    expect(getByText("card body")).toBeTruthy();
  });

  it("applies the shared card radius and padding", async () => {
    const { toJSON } = await render(<UiCard />);
    const style = flatten((toJSON() as any).props.style);
    expect(style.borderRadius).toBe(radii.xl);
    expect(style.padding).toBe(CARD_PADDING);
  });

  it("uses the background colour of the active colour scheme", async () => {
    mockColorScheme.mockReturnValue("dark");
    const { toJSON } = await render(<UiCard />);
    const style = flatten((toJSON() as any).props.style);
    expect(style.backgroundColor).toBe(Colors.dark.background);
    mockColorScheme.mockReturnValue("light");
  });

  it("lets a caller style override the defaults", async () => {
    const { toJSON } = await render(
      <UiCard style={{ borderRadius: 0, padding: 4 }} />,
    );
    const style = flatten((toJSON() as any).props.style);
    expect(style.borderRadius).toBe(0);
    expect(style.padding).toBe(4);
  });

  it("forwards other View props", async () => {
    const { getByTestId } = await render(
      <UiCard testID="card" accessibilityLabel="a card" />,
    );
    expect(getByTestId("card").props.accessibilityLabel).toBe("a card");
  });
});
