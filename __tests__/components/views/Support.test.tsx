import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import Support from "#/components/views/Support";

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
}));
jest.mock("#/components/views/Donate", () => () => null);
jest.mock("#/components/Icons", () => ({
  CloseIcon: () => null,
  HeartIcon: () => null,
}));
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    donations: {
      account: {
        holder: "Volksverpetzer",
        bank: "Testbank",
        IBAN: "DE00 0000 0000 0000 0000 00",
        note: "Spende",
      },
    },
  },
}));

const openBankTransfer = async () => {
  const screen = await render(
    <Support article_link={"https://www.volksverpetzer.de/" as never} />,
  );
  await fireEvent.press(screen.getByText("Dauerauftrag"));
  return screen;
};

describe("Support bank transfer dialog", () => {
  beforeEach(() => jest.clearAllMocks());

  it("opens with the account details", async () => {
    const { getByText } = await openBankTransfer();
    expect(getByText("Banküberweisung")).toBeTruthy();
  });

  it("closes when the backdrop is tapped", async () => {
    const { getByTestId, queryByText } = await openBankTransfer();
    await fireEvent.press(getByTestId("bank-transfer-backdrop"));
    expect(queryByText("Banküberweisung")).toBeNull();
  });

  it("closes on Android's back button", async () => {
    const { getByTestId, queryByText } = await openBankTransfer();
    await fireEvent(getByTestId("bank-transfer-modal"), "requestClose");
    expect(queryByText("Banküberweisung")).toBeNull();
  });

  it("closes from the close button", async () => {
    const { getByLabelText, queryByText } = await openBankTransfer();
    await fireEvent.press(getByLabelText("Schließen"));
    expect(queryByText("Banküberweisung")).toBeNull();
  });
});
