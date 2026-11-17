import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render } from "@testing-library/react-native";

import PopupHost from "#/components/popups/PopupHost";
import { popupStore, popups } from "#/helpers/popups";

jest.mock("#/components/Icons", () => ({
  CloseIcon: jest.fn(() => null),
}));

const reset = () => {
  popupStore.answer(null);
  popupStore.closed(popupStore.getState().id);
};

describe("PopupHost", () => {
  beforeEach(() => act(reset));

  it("renders nothing without a request", async () => {
    const { toJSON } = await render(<PopupHost />);
    expect(toJSON()).toBeNull();
  });

  it("shows a confirm dialog and answers with the pressed button", async () => {
    const { getByText } = await render(<PopupHost />);
    let answer: Promise<boolean>;
    await act(() => {
      answer = popups.confirm({
        title: "Erfolge zurücksetzen?",
        message: "Weg ist weg.",
        confirmLabel: "Zurücksetzen",
      });
    });

    expect(getByText("Erfolge zurücksetzen?")).toBeTruthy();
    expect(getByText("Weg ist weg.")).toBeTruthy();
    expect(getByText("Abbrechen")).toBeTruthy();

    await fireEvent.press(getByText("Zurücksetzen"));
    expect(popupStore.getState().visible).toBe(false);

    await act(() => {
      popupStore.closed(popupStore.getState().id);
    });
    await expect(answer).resolves.toBe(true);
  });

  it("answers false when the dialog is cancelled", async () => {
    const { getByText } = await render(<PopupHost />);
    let answer: Promise<boolean>;
    await act(() => {
      answer = popups.confirm({
        title: "Sicher?",
        message: "",
        confirmLabel: "Ja",
      });
    });

    await fireEvent.press(getByText("Abbrechen"));
    await act(() => {
      popupStore.closed(popupStore.getState().id);
    });
    await expect(answer).resolves.toBe(false);
  });

  it("shows the options in a sheet and answers with the picked index", async () => {
    const { getByText, getByTestId } = await render(<PopupHost />);
    let answer: Promise<number | null>;
    await act(() => {
      answer = popups.choose({
        title: "Teilen",
        options: ["Artikel", "Faktencheck"],
      });
    });

    expect(getByTestId("popup-choose")).toBeTruthy();
    await fireEvent.press(getByText("Faktencheck"));
    await act(() => {
      popupStore.closed(popupStore.getState().id);
    });
    await expect(answer).resolves.toBe(1);
  });

  it("answers null when the sheet is closed without a pick", async () => {
    const { getByLabelText } = await render(<PopupHost />);
    let answer: Promise<number | null>;
    await act(() => {
      answer = popups.choose({ title: "Teilen", options: ["A"] });
    });

    await fireEvent.press(getByLabelText("Schließen"));
    await act(() => {
      popupStore.closed(popupStore.getState().id);
    });
    await expect(answer).resolves.toBeNull();
  });
});
