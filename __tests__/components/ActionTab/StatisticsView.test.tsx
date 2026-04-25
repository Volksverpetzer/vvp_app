import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { ScrollView } from "react-native";

import StatisticsView from "#/screens/ActionTab/components/statistics/StatisticsView";

jest.mock("#/helpers/Statistics", () => ({
  __esModule: true,
  // Never-resolving promise: setStatistics is never called, so no async
  // state update occurs and no act(...) wrapping is needed.
  default: { getAllStatistics: jest.fn(() => new Promise(() => {})) },
}));

jest.mock("#/hooks/useFeedDimensions", () => ({
  useFeedDimensions: () => ({ width: 300 }),
}));

jest.mock("#/components/animations/AnimatedPageDots", () =>
  jest.fn(() => null),
);

describe("StatisticsView chevron navigation", () => {
  let mockScrollTo: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    mockScrollTo = jest.fn();
    jest
      .spyOn(ScrollView.prototype, "scrollTo")
      .mockImplementation(mockScrollTo as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("right chevron scrolls to panel width", () => {
    const { getByRole } = render(<StatisticsView />);
    fireEvent.press(getByRole("button", { name: "Nächste Seite" }));
    expect(mockScrollTo).toHaveBeenCalledWith({ x: 300, animated: true });
  });

  it("left chevron scrolls back to start", () => {
    const { getByRole } = render(<StatisticsView />);
    fireEvent.press(getByRole("button", { name: "Vorherige Seite" }));
    expect(mockScrollTo).toHaveBeenCalledWith({ x: 0, animated: true });
  });
});
