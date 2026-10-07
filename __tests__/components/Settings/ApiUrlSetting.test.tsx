import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import { getApiUrlOverride, setApiUrlOverride } from "#/helpers/apiUrl";
import { toast } from "#/helpers/toast";
import ApiUrlSetting from "#/screens/Settings/components/ApiUrlSetting";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { apiUrl: "https://default.example.com" },
}));

jest.mock("#/helpers/toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const input = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.getByLabelText("App-Server-Adresse");

describe("ApiUrlSetting", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await setApiUrlOverride(undefined);
  });

  it("is read-only with only a pen button", async () => {
    const screen = await render(<ApiUrlSetting />);

    expect(input(screen).props.editable).toBe(false);
    expect(input(screen).props.value).toBe("https://default.example.com");
    expect(screen.getByLabelText("App-Server bearbeiten")).toBeTruthy();
    expect(screen.queryByLabelText("Speichern")).toBeNull();
    expect(screen.queryByLabelText("Abbrechen")).toBeNull();
    expect(screen.queryByText("Zurücksetzen")).toBeNull();
  });

  it("pressing the pen makes the field editable and swaps in save/cancel", async () => {
    const screen = await render(<ApiUrlSetting />);

    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));

    expect(input(screen).props.editable).toBe(true);
    expect(screen.getByLabelText("Speichern")).toBeTruthy();
    expect(screen.getByLabelText("Abbrechen")).toBeTruthy();
    expect(screen.queryByLabelText("App-Server bearbeiten")).toBeNull();
  });

  it("cancel discards the edit without saving", async () => {
    const screen = await render(<ApiUrlSetting />);
    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));
    await fireEvent.changeText(input(screen), "https://other.example.com");

    await fireEvent.press(screen.getByLabelText("Abbrechen"));

    expect(input(screen).props.value).toBe("https://default.example.com");
    expect(input(screen).props.editable).toBe(false);
    expect(getApiUrlOverride()).toBeUndefined();
  });

  it("saves a valid URL, leaves edit mode and offers reset", async () => {
    const screen = await render(<ApiUrlSetting />);
    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));
    await fireEvent.changeText(input(screen), " https://self.hosted/ ");

    await fireEvent.press(screen.getByLabelText("Speichern"));

    await waitFor(() =>
      expect(getApiUrlOverride()).toBe("https://self.hosted"),
    );
    expect(input(screen).props.editable).toBe(false);
    expect(input(screen).props.value).toBe("https://self.hosted");
    expect(screen.getByText("Zurücksetzen")).toBeTruthy();
  });

  it("saving the unchanged URL stores nothing", async () => {
    const screen = await render(<ApiUrlSetting />);
    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));

    await fireEvent.press(screen.getByLabelText("Speichern"));

    expect(getApiUrlOverride()).toBeUndefined();
    expect(input(screen).props.editable).toBe(false);
  });

  it("rejects an invalid URL and stays in edit mode", async () => {
    const screen = await render(<ApiUrlSetting />);
    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));
    await fireEvent.changeText(input(screen), "http://insecure");

    await fireEvent.press(screen.getByLabelText("Speichern"));

    expect(toast.error).toHaveBeenCalled();
    expect(getApiUrlOverride()).toBeUndefined();
    expect(input(screen).props.editable).toBe(true);
  });

  it("reset restores the default server", async () => {
    const screen = await render(<ApiUrlSetting />);
    await fireEvent.press(screen.getByLabelText("App-Server bearbeiten"));
    await fireEvent.changeText(input(screen), "https://self.hosted");
    await fireEvent.press(screen.getByLabelText("Speichern"));

    await fireEvent.press(await screen.findByText("Zurücksetzen"));

    await waitFor(() => expect(getApiUrlOverride()).toBeUndefined());
    expect(input(screen).props.value).toBe("https://default.example.com");
    expect(screen.queryByText("Zurücksetzen")).toBeNull();
  });
});
