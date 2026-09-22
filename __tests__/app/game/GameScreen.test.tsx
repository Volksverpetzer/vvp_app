import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import GameScreen from "#/app/game/[gameId]";
import type { DisinfoPair } from "#/types";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({ gameId: "DesinformationMemory" })),
}));

jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: { light: { background: "#fff" } },
}));

interface MemoryGameMockProperties {
  pairs: DisinfoPair[];
  onAllMatched?: () => void;
}

// Stand-in for the real card grid: exposes the pair count it was given
// (to tell level 1 apart from level 2) and a button that fires
// onAllMatched, without having to actually play the memory game.
jest.mock("#/screens/Games/Memory", () => {
  const { Text } = require("react-native");
  return jest.fn(({ pairs, onAllMatched }: MemoryGameMockProperties) => (
    <>
      <Text>{`pairs:${pairs.length}`}</Text>
      <Text onPress={onAllMatched}>complete level</Text>
    </>
  ));
});

interface UnicornEasterEggMockProperties {
  visible: boolean;
  onHide: () => void;
  message?: string;
}

// Stand-in for the mascot popup: exposes its message and a button that
// fires onHide, so the level-advance / finish logic can be driven directly.
jest.mock("#/components/animations/UnicornEasterEgg", () => {
  const { Text } = require("react-native");
  return jest.fn(
    ({ visible, onHide, message }: UnicornEasterEggMockProperties) =>
      visible ? (
        <>
          <Text>{message}</Text>
          <Text onPress={onHide}>hide popup</Text>
        </>
      ) : null,
  );
});

describe("GameScreen", () => {
  it("starts on level 1 with 3 pairs", async () => {
    const { getByText } = await render(<GameScreen />);
    expect(getByText("pairs:3")).toBeTruthy();
  });

  it("shows the celebration popup when a level is completed", async () => {
    const { getByText, queryByText } = await render(<GameScreen />);
    expect(queryByText("Juhu, Level geschafft!")).toBeNull();

    await fireEvent.press(getByText("complete level"));

    expect(getByText("Juhu, Level geschafft!")).toBeTruthy();
  });

  it("advances to level 2 (6 pairs) once the popup hides", async () => {
    const { getByText, queryByText } = await render(<GameScreen />);

    await fireEvent.press(getByText("complete level"));
    await fireEvent.press(getByText("hide popup"));

    expect(queryByText("Juhu, Level geschafft!")).toBeNull();
    expect(getByText("pairs:6")).toBeTruthy();
  });

  it("shows a 'more to come' screen instead of advancing past the last level", async () => {
    const { getByText, queryByText } = await render(<GameScreen />);

    // Finish level 1 -> level 2.
    await fireEvent.press(getByText("complete level"));
    await fireEvent.press(getByText("hide popup"));
    // Finish level 2, the last level.
    await fireEvent.press(getByText("complete level"));
    await fireEvent.press(getByText("hide popup"));

    expect(queryByText(/pairs:/)).toBeNull();
    expect(getByText("Weitere Level folgen bald!")).toBeTruthy();
  });
});
