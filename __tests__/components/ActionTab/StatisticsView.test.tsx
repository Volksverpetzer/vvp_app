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
  default: { getAllStatistics: jest.fn(() => Promise.resolve({})) },
}));

jest.mock("#/hooks/useFeedDimensions", () => ({
  useFeedDimensions: () => ({ width: 300 }),
}));

// Thin stub that renders labelled pressables for each visible chevron.
jest.mock(
  "#/screens/ActionTab/components/statistics/StatisticsPanel",
  () =>
    ({ onLeftPress, onRightPress, showLeftChevron, showRightChevron }: any) => {
      const R = require("react");
      const { Pressable, View } = require("react-native");
      return R.createElement(
        View,
        null,
        showRightChevron &&
          R.createElement(Pressable, {
            testID: "right-chevron",
            onPress: onRightPress,
          }),
        showLeftChevron &&
          R.createElement(Pressable, {
            testID: "left-chevron",
            onPress: onLeftPress,
          }),
      );
    },
);

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
    const { getByTestId } = render(<StatisticsView />);
    fireEvent.press(getByTestId("right-chevron"));
    expect(mockScrollTo).toHaveBeenCalledWith({ x: 300, animated: true });
  });

  it("left chevron scrolls back to start", () => {
    const { getByTestId } = render(<StatisticsView />);
    fireEvent.press(getByTestId("left-chevron"));
    expect(mockScrollTo).toHaveBeenCalledWith({ x: 0, animated: true });
  });
});
