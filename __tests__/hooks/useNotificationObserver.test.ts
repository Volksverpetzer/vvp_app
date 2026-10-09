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
import { router } from "expo-router";

import { useNotificationObserver } from "#/hooks/useNotificationObserver";

let mockIsFoss = false;

jest.mock("#/constants/Config", () => ({
  get isFoss() {
    return mockIsFoss;
  },
  wpUrl: "https://www.volksverpetzer.de",
  feeds: {
    wp: [
      { handle: "https://volksverpetzer.de", enabled: true },
      { handle: "https://pruefpunkt.org", enabled: true },
    ],
  },
}));

jest.mock("expo-notifications", () => ({
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
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

describe("useNotificationObserver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("non-FOSS mode", () => {
    beforeEach(() => {
      mockIsFoss = false;
    });

    it("subscribes to notification responses on mount", async () => {
      await renderHook(() => useNotificationObserver());

      expect(
        Notifications.getLastNotificationResponseAsync,
      ).toHaveBeenCalledTimes(1);
      expect(
        Notifications.addNotificationResponseReceivedListener,
      ).toHaveBeenCalledTimes(1);
    });

    it("removes the listener on unmount", async () => {
      const mockRemove = jest.fn();
      (
        Notifications.addNotificationResponseReceivedListener as jest.Mock
      ).mockReturnValue({ remove: mockRemove });

      const { unmount } = await renderHook(() => useNotificationObserver());
      await unmount();

      expect(mockRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe("tapping a notification", () => {
    beforeEach(() => {
      mockIsFoss = false;
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const openNotification = async (url: string) => {
      (
        Notifications.getLastNotificationResponseAsync as jest.Mock
      ).mockReturnValueOnce(
        Promise.resolve({
          notification: { request: { content: { data: { url } } } },
        }) as never,
      );
      await renderHook(() => useNotificationObserver());
      jest.advanceTimersByTime(2000);
    };

    it("opens a primary-site article by its path", async () => {
      await openNotification("https://www.volksverpetzer.de/analyse/slug/");

      expect(router.push).toHaveBeenCalledWith("/analyse/slug/");
    });

    it("passes originalUrl for a secondary-site article", async () => {
      const url = "https://pruefpunkt.org/cat/slug/";
      await openNotification(url);

      expect(router.push).toHaveBeenCalledWith(
        `/cat/slug/?originalUrl=${encodeURIComponent(url)}`,
      );
    });
  });

  describe("FOSS mode", () => {
    beforeEach(() => {
      mockIsFoss = true;
    });

    afterEach(() => {
      mockIsFoss = false;
    });

    it("does not subscribe to notifications", async () => {
      await renderHook(() => useNotificationObserver());

      expect(
        Notifications.getLastNotificationResponseAsync,
      ).not.toHaveBeenCalled();
      expect(
        Notifications.addNotificationResponseReceivedListener,
      ).not.toHaveBeenCalled();
    });
  });
});
