import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import type { ComponentType } from "react";

import type { DisinfoPair, MemoryCard } from "#/types";

// Plays the real MemoryGame inside GameScreen (only the shuffle is replaced),
// so the level hand-over between the two is covered, which the mocked
// MemoryGame in GameScreen.test.tsx can't do.

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({ gameId: "DesinformationMemory" })),
}));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));
jest.mock("react-native-gesture-handler", () => ({
  ScrollView: jest.fn(({ children }: any) => children),
}));
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));
jest.mock("#/helpers/toast", () => ({ toast: { success: jest.fn() } }));

const mockRegisterEvent = jest.fn();
jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: (...args: unknown[]) => mockRegisterEvent(...args),
}));

// Deck in a fixed order: each pair's technique card followed by its misinfo card,
// so pressing the cards in order solves the board.
jest.mock("#/screens/Games/GameHelper", () => ({
  generateDeck: (pairs: DisinfoPair[]): MemoryCard[] =>
    pairs.flatMap((pair) => [
      {
        pairId: pair.pairId,
        factCheck: pair.factCheck,
        instanceId: `${pair.pairId}-tech`,
        isFlipped: false,
        isMatched: false,
        cardType: "technique" as const,
        content: pair.technique,
      },
      {
        pairId: pair.pairId,
        factCheck: pair.factCheck,
        instanceId: `${pair.pairId}-mis`,
        isFlipped: false,
        isMatched: false,
        cardType: "misinfo" as const,
        content: pair.misinfo,
        fullContent: pair.misinfo,
      },
    ]),
}));

jest.mock("#/components/animations/UnicornEasterEgg", () => {
  const { Text } = require("react-native");
  return jest.fn(
    ({
      visible,
      onHide,
      message,
    }: {
      visible: boolean;
      onHide: () => void;
      message?: string;
    }) =>
      visible ? (
        <>
          <Text>{message}</Text>
          <Text onPress={onHide}>hide popup</Text>
        </>
      ) : null,
  );
});

const GameScreen = require("#/app/game/[gameId]").default as ComponentType;

type Screen = Awaited<ReturnType<typeof render>>;

const cardButtons = (screen: Screen) =>
  screen
    .getAllByRole("button")
    .filter((button) => button.props.accessibilityLabel !== "hide popup");

// The first tap after a matched pair only clears the selection, so each card
// is tapped twice; a second tap on an already turned card does nothing.
const solveBoard = async (screen: Screen) => {
  const count = cardButtons(screen).length;
  for (let index = 0; index < count; index++) {
    await fireEvent.press(cardButtons(screen)[index]);
    await fireEvent.press(cardButtons(screen)[index]);
  }
};

const completedLevels = () =>
  mockRegisterEvent.mock.calls
    .filter(([, event]) => event === "Game Level Completed")
    .map(([, , props]) => (props as { level: number }).level);

describe("GameScreen with the real MemoryGame", () => {
  beforeEach(() => mockRegisterEvent.mockClear());

  it("lets the player play level 2 after finishing level 1", async () => {
    const screen = await render(<GameScreen />);
    expect(cardButtons(screen)).toHaveLength(6);

    await solveBoard(screen);
    expect(completedLevels()).toEqual([1]);
    await fireEvent.press(screen.getByText("hide popup"));

    // Level 2's board is shown and not reported as solved on its own.
    expect(screen.queryByText("Juhu, Level geschafft!")).toBeNull();
    expect(screen.queryByText("Weitere Level folgen bald!")).toBeNull();
    expect(cardButtons(screen)).toHaveLength(12);
    expect(completedLevels()).toEqual([1]);

    await solveBoard(screen);
    expect(completedLevels()).toEqual([1, 2]);
    await fireEvent.press(screen.getByText("hide popup"));
    expect(screen.getByText("Weitere Level folgen bald!")).toBeTruthy();
  });

  it("sends Game Started once, for the first card of level 1", async () => {
    const screen = await render(<GameScreen />);
    await solveBoard(screen);
    await fireEvent.press(screen.getByText("hide popup"));
    await fireEvent.press(cardButtons(screen)[0]);

    const started = mockRegisterEvent.mock.calls.filter(
      ([, event]) => event === "Game Started",
    );
    expect(started).toEqual([
      ["", "Game Started", { game: "DesinformationMemory" }],
    ]);
  });
});
