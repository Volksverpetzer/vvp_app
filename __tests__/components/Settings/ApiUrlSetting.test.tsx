import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import type * as ApiUrlModule from "#/helpers/apiUrl";
import { setApiUrlOverride } from "#/helpers/apiUrl";
import { toast } from "#/helpers/toast";
import ApiUrlSetting from "#/screens/Settings/components/ApiUrlSetting";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { apiUrl: "https://default.example.com" },
}));

jest.mock("#/helpers/toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("#/helpers/apiUrl", () => {
  const actual = jest.requireActual<typeof ApiUrlModule>("#/helpers/apiUrl");
  return {
    ...actual,
    setApiUrlOverride: jest
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined),
  };
});

const input = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.getByLabelText("App-Server-Adresse");

describe("ApiUrlSetting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is read-only with a pen button and no save/cancel buttons", async () => {
    const screen = await render(<ApiUrlSetting />);

    expect(input(screen).props.editable).toBe(false);
    expect(input(screen).props.value).toBe("https://default.example.com");
    expect(screen.getByLabelText("App-Server bearbeiten")).toBeTruthy();
    expect(screen.queryByText("Speichern")).toBeNull();
    expect(screen.queryByText("Abbrechen")).toBeNull();
  });

  it("pressing the pen makes the field editable and swaps in reset", async () => {
    const screen = await render(<ApiUrlSetting />);

    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));

    expect(input(screen).props.editable).toBe(true);
    expect(screen.getByText("Speichern")).toBeTruthy();
    expect(screen.getByText("Abbrechen")).toBeTruthy();
    expect(screen.queryByLabelText("App-Server bearbeiten")).toBeNull();
    expect(screen.getByLabelText("Standard-Server einsetzen")).toBeTruthy();
  });

  it("cancel discards the edit without saving", async () => {
    const screen = await render(<ApiUrlSetting />);
    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));
    await fireEvent.changeText(input(screen), "https://other.example.com");

    await fireEvent.press(screen.getByText("Abbrechen"));

    expect(input(screen).props.value).toBe("https://default.example.com");
    expect(input(screen).props.editable).toBe(false);
    expect(setApiUrlOverride).not.toHaveBeenCalled();
  });

  it("saves a valid URL and leaves edit mode", async () => {
    const screen = await render(<ApiUrlSetting />);
    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));
    await fireEvent.changeText(input(screen), " https://self.hosted/ ");

    await fireEvent.press(screen.getByText("Speichern"));

    await waitFor(() =>
      expect(setApiUrlOverride).toHaveBeenCalledWith("https://self.hosted"),
    );
    await waitFor(() => expect(input(screen).props.editable).toBe(false));
    expect(input(screen).props.value).toBe("https://self.hosted");
  });

  it("rejects an invalid URL and stays in edit mode", async () => {
    const screen = await render(<ApiUrlSetting />);
    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));
    await fireEvent.changeText(input(screen), "http://insecure");

    await fireEvent.press(screen.getByText("Speichern"));

    expect(toast.error).toHaveBeenCalled();
    expect(setApiUrlOverride).not.toHaveBeenCalled();
    expect(input(screen).props.editable).toBe(true);
  });

  it("reset fills in the default URL", async () => {
    const screen = await render(<ApiUrlSetting />);
    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));
    await fireEvent.changeText(input(screen), "https://other.example.com");

    await fireEvent.press(screen.getByLabelText("Standard-Server einsetzen"));

    expect(input(screen).props.value).toBe("https://default.example.com");
  });
});
