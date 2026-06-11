import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import StatisticsView from "#/screens/ActionTab/components/statistics/StatisticsView";

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  useSharedValue: jest.fn((v: number) => ({ value: v })),
  useAnimatedRef: jest.fn(() => ({ current: null })),
  useAnimatedScrollHandler: jest.fn(() => () => {}),
  runOnUI: jest.fn((fn: (...args: unknown[]) => void) => fn),
  scrollTo: jest.fn(),
  default: {
    ScrollView: require("react-native").ScrollView,
  },
}));

const mockScrollTo = jest.fn();

jest.mock("#/helpers/Statistics", () => ({
  __esModule: true,
  default: { getAllStatistics: jest.fn(() => new Promise(() => {})) },
}));

jest.mock("#/hooks/useFeedDimensions", () => ({
  useFeedDimensions: () => ({ width: 300 }),
}));

jest.mock("#/components/animations/AnimatedPageDots", () =>
  jest.fn(() => null),
);

describe("StatisticsView chevron navigation", () => {
  beforeEach(() => {
    mockScrollTo.mockClear();
    const reanimated = require("react-native-reanimated");
    reanimated.runOnUI.mockImplementation(
      (fn: (...args: unknown[]) => void) => fn,
    );
    reanimated.scrollTo.mockImplementation(mockScrollTo);
  });

  it("right chevron scrolls to panel width", () => {
    const { getByRole } = render(<StatisticsView />);
    fireEvent.press(getByRole("button", { name: "Nächste Seite" }));
    expect(mockScrollTo).toHaveBeenCalledWith(expect.anything(), 300, 0, true);
  });

  it("left chevron scrolls back to start", () => {
    const { getByRole } = render(<StatisticsView />);
    fireEvent.press(getByRole("button", { name: "Vorherige Seite" }));
    expect(mockScrollTo).toHaveBeenCalledWith(expect.anything(), 0, 0, true);
  });
});
