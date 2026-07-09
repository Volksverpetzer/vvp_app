import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import ReportScreen from "#/app/(tabs)/report";
import NotificationManager from "#/helpers/Notifications";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { registerEvent } from "#/helpers/network/Analytics";
import API from "#/helpers/network/ServerAPI";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("#/components/animations/AnimatedHeader", () => jest.fn(() => null));
jest.mock("#/components/animations/AnimatedSuccess", () => jest.fn(() => null));
jest.mock("#/screens/ReportTab/components/ReportStatusList", () =>
  jest.fn(() => null),
);

jest.mock("react-native-gesture-handler", () => ({
  ScrollView: ({ children }: any) => children,
}));

jest.mock("#/helpers/Notifications", () => ({
  __esModule: true,
  default: {
    getToken: jest.fn(),
  },
}));

jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: {
    reportFake: jest.fn(),
  },
}));

jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: jest.fn(() => Promise.resolve()),
}));

jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    getReports: jest.fn(() => Promise.resolve([])),
    setReports: jest.fn(() => Promise.resolve()),
  },
}));

const fillValidForm = async ({
  getByAccessibilityHint,
  url = "https://example.com/fake",
}: {
  getByAccessibilityHint: (hint: string) => any;
  url?: string;
}) => {
  await fireEvent.changeText(
    getByAccessibilityHint("Gib eine kurze Zusammenfassung ein"),
    "Test fake report description",
  );
  await fireEvent.changeText(getByAccessibilityHint("Gib einen Link ein"), url);
};

describe("Report submission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(PersonalStore.getReports).mockResolvedValue([]);
  });

  it("retrieves the notification token and passes it to reportFake", async () => {
    const mockToken = "expo-push-token-xyz123";
    jest.mocked(NotificationManager.getToken).mockResolvedValue(mockToken);
    jest.mocked(API.reportFake).mockResolvedValue({ id: "report-id-123" });

    const { getByAccessibilityHint, getByRole } = await render(
      <ReportScreen />,
    );
    await fillValidForm({ getByAccessibilityHint });
    await fireEvent.press(getByRole("button"));

    await waitFor(() => {
      expect(API.reportFake).toHaveBeenCalledWith(
        expect.objectContaining({ token: mockToken }),
      );
    });
  });

  it("normalizes an empty token (web/FOSS builds) to undefined", async () => {
    jest.mocked(NotificationManager.getToken).mockResolvedValue("");
    jest.mocked(API.reportFake).mockResolvedValue({ id: "report-id-123" });

    const { getByAccessibilityHint, getByRole } = await render(
      <ReportScreen />,
    );
    await fillValidForm({ getByAccessibilityHint });
    await fireEvent.press(getByRole("button"));

    await waitFor(() => {
      expect(API.reportFake).toHaveBeenCalledWith(
        expect.objectContaining({ token: undefined }),
      );
    });
  });

  it("submits with an undefined token and logs a warning when token retrieval fails", async () => {
    const tokenError = new Error("Token retrieval failed");
    jest.mocked(NotificationManager.getToken).mockRejectedValue(tokenError);
    jest.mocked(API.reportFake).mockResolvedValue({ id: "report-id-123" });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { getByAccessibilityHint, getByRole } = await render(
      <ReportScreen />,
    );
    await fillValidForm({ getByAccessibilityHint });
    await fireEvent.press(getByRole("button"));

    await waitFor(() => {
      expect(API.reportFake).toHaveBeenCalledWith(
        expect.objectContaining({ token: undefined }),
      );
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to get notification token:",
      tokenError,
    );
    warnSpy.mockRestore();
  });

  it("trims the URL before submitting and tracking the analytics event", async () => {
    jest.mocked(NotificationManager.getToken).mockResolvedValue("");
    jest.mocked(API.reportFake).mockResolvedValue({ id: "report-id-123" });

    const { getByAccessibilityHint, getByRole } = await render(
      <ReportScreen />,
    );
    await fillValidForm({
      getByAccessibilityHint,
      url: "  https://example.com/fake  ",
    });
    await fireEvent.press(getByRole("button"));

    await waitFor(() => {
      expect(API.reportFake).toHaveBeenCalledWith(
        expect.objectContaining({ url: "https://example.com/fake" }),
      );
    });
    expect(registerEvent).toHaveBeenCalledWith(
      expect.anything(),
      "Report Submitted",
      expect.objectContaining({ has_url: true }),
    );
  });

  it("rejects a non-empty URL without http/https and does not submit", async () => {
    const { getByAccessibilityHint, getByRole, findByText } = await render(
      <ReportScreen />,
    );
    await fillValidForm({ getByAccessibilityHint, url: "example.com/fake" });
    await fireEvent.press(getByRole("button"));

    expect(
      await findByText(
        "Bitte einen gültigen Link eingeben (http:// oder https://)",
      ),
    ).toBeTruthy();
    expect(API.reportFake).not.toHaveBeenCalled();
  });

  it("allows submitting with an empty URL", async () => {
    jest.mocked(NotificationManager.getToken).mockResolvedValue("");
    jest.mocked(API.reportFake).mockResolvedValue({ id: "report-id-123" });

    const { getByAccessibilityHint, getByRole } = await render(
      <ReportScreen />,
    );
    await fillValidForm({ getByAccessibilityHint, url: "" });
    await fireEvent.press(getByRole("button"));

    await waitFor(() => {
      expect(API.reportFake).toHaveBeenCalledWith(
        expect.objectContaining({ url: "" }),
      );
    });
  });
});
