import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text, View } from "react-native";

import RenderWhenNearViewport from "#/components/views/RenderWhenNearViewport";
import {
  ScrollViewportContext,
  createScrollViewport,
} from "#/hooks/useNearViewport";

// The window is 1334pt tall in the RN jest preset, which is also the margin.
const SCREEN = 1334;

const renderAt = async (elementTop: number) => {
  const viewport = createScrollViewport({ current: {} as View }, SCREEN);
  const measureLayout = jest
    .spyOn(View.prototype, "measureLayout")
    .mockImplementation((_relativeTo, onSuccess) => {
      onSuccess(0, elementTop, 300, 450);
    });
  const screen = await render(
    <ScrollViewportContext.Provider value={viewport}>
      <RenderWhenNearViewport style={{ minHeight: 450 }} testID="placeholder">
        <Text>card</Text>
      </RenderWhenNearViewport>
    </ScrollViewportContext.Provider>,
  );
  const placeholder = screen.getByTestId("placeholder");
  await fireEvent(placeholder, "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 450 } },
  });
  return { ...screen, viewport, measureLayout };
};

describe("RenderWhenNearViewport", () => {
  afterEach(() => jest.restoreAllMocks());

  it("renders its children right away outside a scroll viewport", async () => {
    const { getByText } = await render(
      <RenderWhenNearViewport>
        <Text>card</Text>
      </RenderWhenNearViewport>,
    );
    expect(getByText("card")).toBeTruthy();
  });

  it("renders children that start within a screen of the visible window", async () => {
    const { getByText } = await renderAt(SCREEN + 500);
    expect(getByText("card")).toBeTruthy();
  });

  it("defers far-away children until the reader scrolls close", async () => {
    const { queryByText, viewport } = await renderAt(10_000);
    expect(queryByText("card")).toBeNull();

    await act(() => {
      viewport.update(5000, SCREEN);
    });
    expect(queryByText("card")).toBeNull();

    await act(() => {
      viewport.update(8000, SCREEN);
    });
    expect(queryByText("card")).toBeTruthy();

    // Stays mounted once shown.
    await act(() => {
      viewport.update(0, SCREEN);
    });
    expect(queryByText("card")).toBeTruthy();
  });

  it("does not render children the reader has jumped far past", async () => {
    const { queryByText, viewport } = await renderAt(10_000);
    await act(() => {
      viewport.update(20_000, SCREEN);
    });
    expect(queryByText("card")).toBeNull();
  });
});
