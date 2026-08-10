import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import { spacing } from "#/constants/Spacing";
import MemoryGame from "#/screens/Games/Memory";
import type { DisinfoPair, MemoryCard } from "#/types";

const mockGenerateDeck = jest.fn<(pairs: DisinfoPair[]) => MemoryCard[]>();

jest.mock("#/screens/Games/GameHelper", () => ({
  generateDeck: (pairs: unknown) => mockGenerateDeck(pairs as DisinfoPair[]),
}));

const mockToastShow = jest.fn();
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: Object.assign(jest.fn(() => null) as unknown as () => null, {
    show: (...args: unknown[]) => mockToastShow(...args),
  }),
}));

beforeEach(() => {
  mockGenerateDeck.mockReset();
  mockToastShow.mockClear();
});

const pairs: DisinfoPair[] = [
  {
    pairId: "1",
    technique: "Straw man",
    misinfo: "They said the sky is green.",
    factCheck: "No credible source claims the sky is green.",
  },
];

// A fixed, non-shuffled deck so tests can address "the first card" /
// "the second card" deterministically instead of depending on generateDeck's
// internal shuffle.
const fixedDeck: MemoryCard[] = [
  {
    pairId: "1",
    factCheck: pairs[0].factCheck,
    instanceId: "1-tech",
    isFlipped: false,
    isMatched: false,
    cardType: "technique",
    content: "Straw man",
  },
  {
    pairId: "1",
    factCheck: pairs[0].factCheck,
    instanceId: "1-mis",
    isFlipped: false,
    isMatched: false,
    cardType: "misinfo",
    content: "They said the sky is green.",
    fullContent: "They said the sky is green.",
  },
];

const mismatchedDeck: MemoryCard[] = [
  ...fixedDeck,
  {
    pairId: "2",
    factCheck: "Different fact-check.",
    instanceId: "2-tech",
    isFlipped: false,
    isMatched: false,
    cardType: "technique",
    content: "Ad hominem",
  },
];

describe("MemoryGame", () => {
  it("renders one card per deck entry", async () => {
    mockGenerateDeck.mockReturnValue(fixedDeck);
    const { getAllByRole } = await render(<MemoryGame pairs={pairs} />);
    expect(getAllByRole("button")).toHaveLength(fixedDeck.length);
  });

  it("shows the instructional prompt before any card is selected", async () => {
    mockGenerateDeck.mockReturnValue(fixedDeck);
    const { getByText } = await render(<MemoryGame pairs={pairs} />);
    expect(
      getByText("Tippe auf eine Karte, um deren Inhalt anzuzeigen."),
    ).toBeTruthy();
  });

  it("shows the flipped card's content once selected", async () => {
    mockGenerateDeck.mockReturnValue(fixedDeck);
    const { getAllByRole, getAllByText, queryByText } = await render(
      <MemoryGame pairs={pairs} />,
    );
    await fireEvent.press(getAllByRole("button")[0]);
    expect(getAllByText("Straw man").length).toBeGreaterThan(0);
    expect(
      queryByText("Tippe auf eine Karte, um deren Inhalt anzuzeigen."),
    ).toBeNull();
  });

  it("matches two cards from the same pair and shows a success toast", async () => {
    mockGenerateDeck.mockReturnValue(fixedDeck);
    const { getAllByRole, getAllByText } = await render(
      <MemoryGame pairs={pairs} />,
    );
    const buttons = getAllByRole("button");
    await fireEvent.press(buttons[0]);
    await fireEvent.press(buttons[1]);

    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", text1: "Richtig" }),
    );
    // Both matched cards reveal their content permanently.
    expect(getAllByText("Straw man").length).toBeGreaterThan(0);
    expect(getAllByText("They said the sky is green.").length).toBeGreaterThan(
      0,
    );
  });

  it("resets the selection instead of flipping a third card after a mismatch", async () => {
    mockGenerateDeck.mockReturnValue(mismatchedDeck);
    const { getAllByRole, queryByText } = await render(
      <MemoryGame pairs={pairs} />,
    );
    const buttons = getAllByRole("button");
    await fireEvent.press(buttons[0]); // pairId "1", face up
    await fireEvent.press(buttons[2]); // pairId "2", face up, no match
    expect(mockToastShow).not.toHaveBeenCalled();

    // A third press only resets the mismatched pair back face-down instead
    // of flipping the new card.
    await fireEvent.press(buttons[1]);
    expect(queryByText("Ad hominem")).toBeNull();
    expect(queryByText("Straw man")).toBeNull();
  });

  // Regression guard: the grid used to give each card its own `margin`,
  // where two adjacent cards' margins summed to the real gap (5+5=10). That
  // was flipped to a single `gap` on the grid container — reusing the old
  // per-card value directly (spacing.xs) would have silently halved the
  // on-screen spacing between cards. See CardComponent.tsx / this PR.
  it("keeps the grid gap sized to replace the old doubled per-card margin", async () => {
    mockGenerateDeck.mockReturnValue(fixedDeck);
    const { toJSON } = await render(<MemoryGame pairs={pairs} />);

    const flatten = (style: unknown): Record<string, unknown> => {
      const parts = Array.isArray(style) ? style.flat(Infinity) : [style];
      return Object.assign({}, ...parts.filter(Boolean));
    };
    const findGrid = (node: any): any => {
      if (!node) return undefined;
      if (flatten(node.props?.style).flexWrap === "wrap") return node;
      for (const child of node.children ?? []) {
        if (typeof child !== "object") continue;
        const found = findGrid(child);
        if (found) return found;
      }
      return undefined;
    };

    const gridNode = findGrid(toJSON());
    expect(gridNode).toBeDefined();
    expect(flatten(gridNode.props.style).gap).toBe(spacing.md);
  });
});
