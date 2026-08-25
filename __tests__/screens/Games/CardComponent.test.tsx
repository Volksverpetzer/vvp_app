import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import CardComponent from "#/screens/Games/CardComponent";
import type { MemoryCard } from "#/types";

const flatten = (style: unknown): Record<string, unknown> => {
  const parts = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...parts.filter(Boolean));
};

const baseCard: MemoryCard = {
  pairId: "1",
  factCheck: "Fact-check text",
  instanceId: "1-tech",
  isFlipped: false,
  isMatched: false,
  cardType: "technique",
  content: "Straw man",
};

describe("CardComponent", () => {
  it("shows a question mark face-down", async () => {
    const { getByText } = await render(
      <CardComponent card={baseCard} onPress={jest.fn()} />,
    );
    expect(getByText("?")).toBeTruthy();
  });

  it("reveals its content when flipped", async () => {
    const { getByText } = await render(
      <CardComponent
        card={{ ...baseCard, isFlipped: true }}
        onPress={jest.fn()}
      />,
    );
    expect(getByText("Straw man")).toBeTruthy();
  });

  it("reveals its content when matched, even if not flipped", async () => {
    const { getByText } = await render(
      <CardComponent
        card={{ ...baseCard, isMatched: true }}
        onPress={jest.fn()}
      />,
    );
    expect(getByText("Straw man")).toBeTruthy();
  });

  it("applies the matched border colour instead of the selected one", async () => {
    const { getByRole } = await render(
      <CardComponent
        card={{ ...baseCard, isFlipped: true, isMatched: true }}
        onPress={jest.fn()}
      />,
    );
    const style = flatten(getByRole("button").props.style);
    expect(style.borderColor).toBe("#28a745");
  });

  it("applies the selected border colour while flipped but not matched", async () => {
    const { getByRole } = await render(
      <CardComponent
        card={{ ...baseCard, isFlipped: true }}
        onPress={jest.fn()}
      />,
    );
    const style = flatten(getByRole("button").props.style);
    expect(style.borderColor).toBe("#ffa500");
  });

  it("calls onPress with the card when tapped", async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <CardComponent card={baseCard} onPress={onPress} />,
    );
    await fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(baseCard);
  });
});
