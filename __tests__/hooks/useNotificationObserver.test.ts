import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";

import { useNotificationObserver } from "#/hooks/useNotificationObserver";

let mockIsFoss = false;

jest.mock("#/constants/Config", () => ({
  get isFoss() {
    return mockIsFoss;
  },
}));

jest.mock("expo-notifications", () => ({
  getLastNotificationResponseAsync: jest.fn().mockResolvedValue(null),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

jest.mock("expo-linking", () => ({
  parse: jest.fn(() => ({ path: null })),
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

describe("useNotificationObserver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("non-FOSS mode", () => {
    beforeEach(() => {
      mockIsFoss = false;
    });

    it("subscribes to notification responses on mount", () => {
      renderHook(() => useNotificationObserver());

      expect(
        Notifications.getLastNotificationResponseAsync,
      ).toHaveBeenCalledTimes(1);
      expect(
        Notifications.addNotificationResponseReceivedListener,
      ).toHaveBeenCalledTimes(1);
    });

    it("removes the listener on unmount", () => {
      const mockRemove = jest.fn();
      (
        Notifications.addNotificationResponseReceivedListener as jest.Mock
      ).mockReturnValue({ remove: mockRemove });

      const { unmount } = renderHook(() => useNotificationObserver());
      unmount();

      expect(mockRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe("FOSS mode", () => {
    beforeEach(() => {
      mockIsFoss = true;
    });

    afterEach(() => {
      mockIsFoss = false;
    });

    it("does not subscribe to notifications", () => {
      renderHook(() => useNotificationObserver());

      expect(
        Notifications.getLastNotificationResponseAsync,
      ).not.toHaveBeenCalled();
      expect(
        Notifications.addNotificationResponseReceivedListener,
      ).not.toHaveBeenCalled();
    });
  });
});
