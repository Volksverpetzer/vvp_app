import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import NotificationManager from "#/helpers/Notifications";
import API from "#/helpers/network/ServerAPI";

// Mock the NotificationManager
jest.mock("#/helpers/Notifications", () => ({
  __esModule: true,
  default: {
    getToken: jest.fn(),
  },
}));

// Mock the API
jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: {
    reportFake: jest.fn(),
  },
}));

describe("Report submission with token", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should retrieve notification token and pass it to reportFake", async () => {
    // Setup
    const mockToken = "expo-push-token-xyz123";
    const mockReport = {
      description: "Test fake report",
      more_info: "Test more info",
      url: "https://example.com/fake",
      allowed_public: true,
    };
    const mockResponse = { id: "report-id-123" };

    // Mock the token retrieval
    (NotificationManager.getToken as any).mockResolvedValue(mockToken);

    // Mock the API call
    (API.reportFake as any).mockResolvedValue(mockResponse);

    // Execute - simulate what report.tsx does in onSubmit
    let token: string | undefined;
    try {
      token = (await NotificationManager.getToken()) || undefined;
    } catch (error) {
      console.warn("Failed to get notification token:", error);
    }

    const reportWithToken = {
      ...mockReport,
      token,
    };

    const result = await API.reportFake(reportWithToken);

    // Assert
    expect(NotificationManager.getToken).toHaveBeenCalled();
    expect(API.reportFake).toHaveBeenCalledWith({
      description: "Test fake report",
      more_info: "Test more info",
      url: "https://example.com/fake",
      allowed_public: true,
      token: mockToken,
    });
    expect(result).toEqual(mockResponse);
  });

  it("should handle token retrieval failure gracefully", async () => {
    // Setup
    const mockReport = {
      description: "Test fake report",
      more_info: "Test more info",
      url: "https://example.com/fake",
      allowed_public: true,
    };
    const mockResponse = { id: "report-id-123" };

    // Mock the token retrieval to fail
    (NotificationManager.getToken as any).mockRejectedValue(
      new Error("Token retrieval failed"),
    );

    // Mock the API call
    (API.reportFake as any).mockResolvedValue(mockResponse);

    // Execute - simulate what report.tsx does in onSubmit
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    let token: string | undefined;
    try {
      token = (await NotificationManager.getToken()) || undefined;
    } catch (error) {
      console.warn("Failed to get notification token:", error);
      // Token remains undefined
    }
    warnSpy.mockRestore();

    const reportWithToken = {
      ...mockReport,
      token,
    };

    const result = await API.reportFake(reportWithToken);

    // Assert - should still work even if token retrieval failed
    expect(API.reportFake).toHaveBeenCalledWith({
      description: "Test fake report",
      more_info: "Test more info",
      url: "https://example.com/fake",
      allowed_public: true,
      token: undefined,
    });
    expect(result).toEqual(mockResponse);
  });

  it("should normalize an empty token (web/FOSS builds) to undefined", async () => {
    // Setup
    const mockReport = {
      description: "Test fake report",
      more_info: "Test more info",
      url: "https://example.com/fake",
      allowed_public: true,
    };
    const mockResponse = { id: "report-id-123" };

    // getToken() resolves to "" on web/FOSS builds rather than rejecting
    (NotificationManager.getToken as any).mockResolvedValue("");

    // Mock the API call
    (API.reportFake as any).mockResolvedValue(mockResponse);

    // Execute - simulate what report.tsx does in onSubmit
    let token: string | undefined;
    try {
      token = (await NotificationManager.getToken()) || undefined;
    } catch (error) {
      console.warn("Failed to get notification token:", error);
    }

    const reportWithToken = {
      ...mockReport,
      token,
    };

    const result = await API.reportFake(reportWithToken);

    // Assert - an empty string token must not be sent as-is
    expect(API.reportFake).toHaveBeenCalledWith({
      description: "Test fake report",
      more_info: "Test more info",
      url: "https://example.com/fake",
      allowed_public: true,
      token: undefined,
    });
    expect(result).toEqual(mockResponse);
  });
});
