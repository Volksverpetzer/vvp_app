import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Platform, StyleSheet, Text } from "react-native";

import UiModal, {
  SWIPE_CLOSE_DISTANCE,
  SWIPE_CLOSE_VELOCITY,
} from "#/components/ui/UiModal";
import type { UiModalVariant } from "#/components/ui/UiModal";

jest.mock("#/components/Icons", () => ({
  CloseIcon: jest.fn(() => null),
}));

// Keep Gesture Handler real, but capture the sheet's pan config so the swipe
// callbacks can be driven directly (the test renderer has no touch system)
let mockPanConfig: any;
jest.mock("react-native-gesture-handler", () => {
  const actual = jest.requireActual<any>("react-native-gesture-handler");
  return {
    ...actual,
    usePanGesture: (config: unknown) => {
      mockPanConfig = config;
      return actual.usePanGesture(config);
    },
  };
});

const modal = (
  isVisible: boolean,
  onClose: () => void,
  variant: UiModalVariant,
) => (
  <UiModal
    isVisible={isVisible}
    onClose={onClose}
    variant={variant}
    title="Titel"
  >
    <Text>Inhalt</Text>
  </UiModal>
);

const renderModal = (
  isVisible: boolean,
  variant: UiModalVariant = "sheet",
  onClose = jest.fn(),
) => render(modal(isVisible, onClose, variant));

const translateYOf = (element: { props: Record<string, any> }) =>
  (StyleSheet.flatten(element.props.style as never) as any)?.transform?.[0]
    ?.translateY;

describe.each(["sheet", "dialog"] as const)("UiModal (%s)", (variant) => {
  beforeEach(() => jest.clearAllMocks());

  it("renders nothing while hidden", async () => {
    const { queryByText } = await renderModal(false, variant);
    expect(queryByText("Inhalt")).toBeNull();
  });

  it("shows the title and content when visible", async () => {
    const { getByText } = await renderModal(true, variant);
    expect(getByText("Titel")).toBeTruthy();
    expect(getByText("Inhalt")).toBeTruthy();
  });

  it("closes when the backdrop is tapped", async () => {
    const onClose = jest.fn();
    const { getByTestId } = await renderModal(true, variant, onClose);
    await fireEvent.press(getByTestId("ui-modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Android's back button", async () => {
    const onClose = jest.fn();
    const { getByTestId } = await renderModal(true, variant, onClose);
    await fireEvent(getByTestId("ui-modal"), "requestClose");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the close button", async () => {
    const onClose = jest.fn();
    const { getByLabelText } = await renderModal(true, variant, onClose);
    await fireEvent.press(getByLabelText("Schließen"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("unmounts its content once the closing animation finishes", async () => {
    const onClose = jest.fn();
    const screen = await renderModal(true, variant, onClose);
    await screen.rerender(modal(false, onClose, variant));
    expect(screen.queryByText("Inhalt")).toBeNull();
  });
});

describe("UiModal onClosed", () => {
  const withOnClosed = (isVisible: boolean, onClosed: () => void) => (
    <UiModal isVisible={isVisible} onClose={jest.fn()} onClosed={onClosed}>
      <Text>Inhalt</Text>
    </UiModal>
  );

  it("does not fire for a modal that was never open", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const onClosed = jest.fn();
    await render(withOnClosed(false, onClosed));
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("fires once the closing animation has finished outside iOS", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const onClosed = jest.fn();
    const screen = await render(withOnClosed(true, onClosed));
    expect(onClosed).not.toHaveBeenCalled();
    await screen.rerender(withOnClosed(false, onClosed));
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
  });

  it("ignores a close that completes after the modal was reopened", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const onClosed = jest.fn();
    // Hold back the JS-thread callback of the closing animation, as if it
    // were still queued when the modal is opened again
    const worklets = jest.requireMock<any>("react-native-worklets");
    const queued: (() => void)[] = [];
    const spy = jest
      .spyOn(worklets, "scheduleOnRN")
      .mockImplementation((callback: any, ...callbackArguments: any[]) => {
        queued.push(() => callback(...callbackArguments));
      });
    const screen = await render(withOnClosed(true, onClosed));
    await screen.rerender(withOnClosed(false, onClosed));
    await screen.rerender(withOnClosed(true, onClosed));
    await act(() => {
      for (const run of queued) run();
    });
    spy.mockRestore();

    expect(onClosed).not.toHaveBeenCalled();
    expect(screen.getByText("Inhalt")).toBeTruthy();
  });

  it("lets only the latest close finish after close, reopen, close", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const onClosed = jest.fn();
    const worklets = jest.requireMock<any>("react-native-worklets");
    const queued: (() => void)[] = [];
    const spy = jest
      .spyOn(worklets, "scheduleOnRN")
      .mockImplementation((callback: any, ...callbackArguments: any[]) => {
        queued.push(() => callback(...callbackArguments));
      });
    const screen = await render(withOnClosed(true, onClosed));
    await screen.rerender(withOnClosed(false, onClosed));
    await screen.rerender(withOnClosed(true, onClosed));
    await screen.rerender(withOnClosed(false, onClosed));
    spy.mockRestore();

    // The first close's callback arrives during the second close
    await act(() => {
      queued[0]();
    });
    expect(onClosed).not.toHaveBeenCalled();
    expect(screen.getByText("Inhalt")).toBeTruthy();

    await act(() => {
      queued[1]();
    });
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Inhalt")).toBeNull();
  });

  it("ignores a late iOS dismissal once reopened", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const onClosed = jest.fn();
    const screen = await render(withOnClosed(true, onClosed));
    const { onDismiss } = screen.getByTestId("ui-modal").props;
    await screen.rerender(withOnClosed(false, onClosed));
    await screen.rerender(withOnClosed(true, onClosed));
    await act(() => {
      onDismiss();
    });
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("waits for the native dismissal on iOS", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const onClosed = jest.fn();
    const screen = await render(withOnClosed(true, onClosed));
    // The test renderer drops a hidden Modal from the tree, so keep a handle
    // on its native dismissal callback from while it was open
    const { onDismiss } = screen.getByTestId("ui-modal").props;
    await screen.rerender(withOnClosed(false, onClosed));
    expect(onClosed).not.toHaveBeenCalled();
    await act(() => {
      onDismiss();
    });
    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});

describe("UiModal sheet swipe", () => {
  beforeEach(() => jest.clearAllMocks());

  it("is only enabled for sheets", async () => {
    await renderModal(true, "dialog");
    expect(mockPanConfig.enabled).toBe(false);
    await renderModal(true, "sheet");
    expect(mockPanConfig.enabled).toBe(true);
  });

  it("follows the finger downwards but not above its resting position", async () => {
    const onClose = jest.fn();
    const screen = await renderModal(true, "sheet", onClose);

    mockPanConfig.onUpdate({ translationY: 60 });
    await screen.rerender(modal(true, onClose, "sheet"));
    expect(translateYOf(screen.getByTestId("ui-modal-content"))).toBe(60);

    mockPanConfig.onUpdate({ translationY: -40 });
    await screen.rerender(modal(true, onClose, "sheet"));
    expect(translateYOf(screen.getByTestId("ui-modal-content"))).toBe(0);
  });

  it("closes when dragged far enough", async () => {
    const onClose = jest.fn();
    await renderModal(true, "sheet", onClose);
    mockPanConfig.onDeactivate({
      translationY: SWIPE_CLOSE_DISTANCE + 1,
      velocityY: 0,
    });
    // scheduleOnRN hands the call to the JS thread asynchronously
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("closes when flung down", async () => {
    const onClose = jest.fn();
    await renderModal(true, "sheet", onClose);
    mockPanConfig.onDeactivate({
      translationY: 10,
      velocityY: SWIPE_CLOSE_VELOCITY + 1,
    });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("snaps back after a short drag", async () => {
    const onClose = jest.fn();
    const screen = await renderModal(true, "sheet", onClose);
    mockPanConfig.onUpdate({ translationY: 40 });
    mockPanConfig.onDeactivate({ translationY: 40, velocityY: 0 });
    await screen.rerender(modal(true, onClose, "sheet"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onClose).not.toHaveBeenCalled();
    expect(translateYOf(screen.getByTestId("ui-modal-content"))).toBe(0);
  });
});
