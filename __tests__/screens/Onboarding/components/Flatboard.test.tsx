import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Platform, Text } from "react-native";
import useWindowDimensions from "react-native/Libraries/Utilities/useWindowDimensions";

import FlatBoard from "#/screens/Onboarding/components/Flatboard";
import type { OnBoardingData } from "#/screens/Onboarding/components/Flatboard";

const mockScrollTo = jest.fn();
const mockUseWindowDimensions = useWindowDimensions as jest.Mock;

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: 400, height: 800, scale: 2, fontScale: 1 })),
}));

// Captured so tests can simulate the carousel reporting a user swipe.
let capturedOnSnapToItem: ((index: number) => void) | null = null;
let capturedCarouselProps: any = null;

jest.mock("react-native-reanimated-carousel", () => {
  const ReactActual = require("react");
  const { View } = require("react-native");

  const Carousel = ReactActual.forwardRef((props: any, ref: any) => {
    capturedOnSnapToItem = props.onSnapToItem;
    capturedCarouselProps = props;
    ReactActual.useImperativeHandle(ref, () => ({
      scrollTo: mockScrollTo,
    }));
    return ReactActual.createElement(
      View,
      { testID: "carousel", style: props.style },
      props.data.map((item: any, index: number) =>
        ReactActual.createElement(
          ReactActual.Fragment,
          { key: item.id },
          props.renderItem({ item, index }),
        ),
      ),
    );
  });

  return { __esModule: true, Carousel };
});

jest.mock("#/helpers/utils/variant", () => ({
  isVolksverpetzer: false,
}));

const makeData = (count: number): OnBoardingData[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Step ${i + 1}`,
    description: `Description ${i + 1}`,
  }));

const defaultProps = {
  data: makeData(3),
  onFinish: jest.fn(),
};

describe("FlatBoard", () => {
  let originalOS: typeof Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnSnapToItem = null;
    capturedCarouselProps = null;
    originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true });
    mockUseWindowDimensions.mockReturnValue({
      width: 400,
      height: 800,
      scale: 2,
      fontScale: 1,
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", {
      value: originalOS,
      configurable: true,
    });
  });

  it("renders the carousel with style-based width/height on native platforms", async () => {
    const { getByTestId } = await render(<FlatBoard {...defaultProps} />);

    const carousel = getByTestId("carousel");
    expect(carousel.props.style).toEqual({ width: 400, height: 800 });
    expect(capturedCarouselProps.loop).toBe(false);
    expect(capturedCarouselProps.data).toEqual(defaultProps.data);
  });

  it("falls back to a plain view without the carousel on web", async () => {
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true });
    const { queryByTestId, getByText } = await render(
      <FlatBoard {...defaultProps} />,
    );

    expect(queryByTestId("carousel")).toBeNull();
    expect(getByText("Step 1")).toBeTruthy();
  });

  it("returns nothing while the window width is not yet measured", async () => {
    mockUseWindowDimensions.mockReturnValue({
      width: 0,
      height: 800,
      scale: 2,
      fontScale: 1,
    });

    const { toJSON } = await render(<FlatBoard {...defaultProps} />);
    expect(toJSON()).toBeNull();
  });

  it("scrolls the carousel forward and notifies onStepChange when Weiter is pressed", async () => {
    const onStepChange = jest.fn();
    const { getByText } = await render(
      <FlatBoard {...defaultProps} onStepChange={onStepChange} />,
    );

    await act(async () => {
      fireEvent.press(getByText("Weiter"));
      await Promise.resolve();
    });

    expect(mockScrollTo).toHaveBeenCalledWith({ index: 1, animated: true });
    expect(onStepChange).toHaveBeenCalledWith(defaultProps.data[1], 1);
  });

  it("scrolls the carousel backward when Zurück is pressed", async () => {
    const onStepChange = jest.fn();
    const { getByText } = await render(
      <FlatBoard {...defaultProps} onStepChange={onStepChange} />,
    );

    await act(async () => {
      fireEvent.press(getByText("Weiter"));
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.press(getByText("Zurück"));
      await Promise.resolve();
    });

    expect(mockScrollTo).toHaveBeenLastCalledWith({
      index: 0,
      animated: true,
    });
    expect(onStepChange).toHaveBeenLastCalledWith(defaultProps.data[0], 0);
  });

  it("clamps forward navigation at the last step", async () => {
    const { getByText } = await render(
      <FlatBoard {...defaultProps} data={makeData(2)} />,
    );

    await act(async () => {
      fireEvent.press(getByText("Weiter"));
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.press(getByText("Get Started"));
      await Promise.resolve();
    });

    expect(mockScrollTo).not.toHaveBeenCalledWith({
      index: 2,
      animated: true,
    });
  });

  it("updates the step and calls onStepChange when the carousel reports a snap", async () => {
    const onStepChange = jest.fn();
    await render(<FlatBoard {...defaultProps} onStepChange={onStepChange} />);

    await act(async () => {
      capturedOnSnapToItem!(2);
      await Promise.resolve();
    });

    expect(onStepChange).toHaveBeenCalledWith(defaultProps.data[2], 2);
  });

  it("adopts the measured container height once the outer view lays out", async () => {
    const { getByTestId } = await render(<FlatBoard {...defaultProps} />);

    await act(async () => {
      fireEvent(getByTestId("flatboard-container"), "layout", {
        nativeEvent: { layout: { height: 700, width: 400, x: 0, y: 0 } },
      });
      await Promise.resolve();
    });

    expect(getByTestId("carousel").props.style).toEqual({
      width: 400,
      height: 700,
    });
  });

  it("renders a step's icon, TopComponent and Component when the container is tall enough", async () => {
    const TopComponent = () => <Text>Top</Text>;
    const Component = () => <Text>Bottom</Text>;
    const data: OnBoardingData[] = [
      {
        id: 1,
        title: "Step 1",
        description: "Description 1",
        icon: 1 as unknown as OnBoardingData["icon"],
        TopComponent,
        Component,
      },
    ];

    const { getByText } = await render(
      <FlatBoard {...defaultProps} data={data} />,
    );

    expect(getByText("Top")).toBeTruthy();
    expect(getByText("Bottom")).toBeTruthy();
  });

  it("calls onFinish when the finish button on the last step is pressed", async () => {
    const onFinish = jest.fn();
    const { getByText } = await render(
      <FlatBoard {...defaultProps} data={makeData(1)} onFinish={onFinish} />,
    );

    await act(async () => {
      fireEvent.press(getByText("Get Started"));
      await Promise.resolve();
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
