import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import BottomSheetModal from "#/components/popups/BottomSheetModal";

jest.mock("#/components/Icons", () => ({
  CloseIcon: jest.fn(() => null),
}));

const renderSheet = (isVisible: boolean, onClose = jest.fn()) =>
  render(
    <BottomSheetModal isVisible={isVisible} onClose={onClose} title="Titel">
      <Text>Inhalt</Text>
    </BottomSheetModal>,
  );

describe("BottomSheetModal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders nothing while hidden", async () => {
    const { queryByText } = await renderSheet(false);
    expect(queryByText("Inhalt")).toBeNull();
  });

  it("shows the title and content when visible", async () => {
    const { getByText } = await renderSheet(true);
    expect(getByText("Titel")).toBeTruthy();
    expect(getByText("Inhalt")).toBeTruthy();
  });

  it("closes when the backdrop is tapped", async () => {
    const onClose = jest.fn();
    const { getByTestId } = await renderSheet(true, onClose);
    await fireEvent.press(getByTestId("bottom-sheet-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Android's back button", async () => {
    const onClose = jest.fn();
    const { getByTestId } = await renderSheet(true, onClose);
    await fireEvent(getByTestId("bottom-sheet-modal"), "requestClose");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the close button", async () => {
    const onClose = jest.fn();
    const { getByLabelText } = await renderSheet(true, onClose);
    await fireEvent.press(getByLabelText("Schließen"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("unmounts its content once the closing animation finishes", async () => {
    const onClose = jest.fn();
    const screen = await renderSheet(true, onClose);
    await screen.rerender(
      <BottomSheetModal isVisible={false} onClose={onClose} title="Titel">
        <Text>Inhalt</Text>
      </BottomSheetModal>,
    );
    expect(screen.queryByText("Inhalt")).toBeNull();
  });
});
