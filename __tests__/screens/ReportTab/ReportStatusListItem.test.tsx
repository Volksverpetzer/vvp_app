import { describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";

import API from "#/helpers/network/ServerAPI";
import ReportStatusListItem from "#/screens/ReportTab/components/ReportStatusListItem";

jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: { getReportStatus: jest.fn() },
}));

jest.mock("#/components/Icons", () => ({
  ReportStatusIcon: jest.fn(() => null),
}));

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});

jest.mock("#/helpers/utils/color", () => ({
  isDarkMode: () => false,
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
}));

const getReportStatus = API.getReportStatus as jest.Mock;

describe("ReportStatusListItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the report id", async () => {
    (getReportStatus as jest.Mock<any>).mockResolvedValue({
      status: "pending",
    });

    const { getByText } = render(<ReportStatusListItem id="abc-123" />);

    await waitFor(() => expect(getReportStatus).toHaveBeenCalled());
    expect(getByText("abc-123")).toBeTruthy();
  });

  it("passes the signal to getReportStatus", async () => {
    (getReportStatus as jest.Mock<any>).mockResolvedValue({ status: "posted" });

    render(<ReportStatusListItem id="rep-1" />);

    await waitFor(() => expect(getReportStatus).toHaveBeenCalledTimes(1));

    const [id, signal] = getReportStatus.mock.calls[0] as [string, AbortSignal];
    expect(id).toBe("rep-1");
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
  });

  it("aborts the request on unmount", async () => {
    let resolve!: (v: any) => void;
    const pending = new Promise((res) => {
      resolve = res;
    });
    getReportStatus.mockReturnValue(pending);

    const { unmount } = render(<ReportStatusListItem id="rep-2" />);

    await waitFor(() => expect(getReportStatus).toHaveBeenCalledTimes(1));

    const signal = (getReportStatus.mock.calls[0] as [string, AbortSignal])[1];
    expect(signal.aborted).toBe(false);

    unmount();
    expect(signal.aborted).toBe(true);

    await act(() => {
      resolve({ status: "pending" });
    });
  });

  it("suppresses state updates after abort", async () => {
    let resolve!: (v: any) => void;
    const pending = new Promise((res) => {
      resolve = res;
    });
    getReportStatus.mockReturnValue(pending);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { unmount } = render(<ReportStatusListItem id="rep-3" />);
    await waitFor(() => expect(getReportStatus).toHaveBeenCalled());

    unmount();

    await act(() => {
      resolve({ status: "posted" });
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("handles API errors without crashing", async () => {
    (getReportStatus as jest.Mock<any>).mockRejectedValue(
      new Error("network failure"),
    );
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<ReportStatusListItem id="rep-4" />);

    await waitFor(() => expect(getReportStatus).toHaveBeenCalled());
    consoleError.mockRestore();
  });
});
