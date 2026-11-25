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

import { registerEvent } from "#/helpers/network/Analytics";
import {
  resetReportedNotificationOpens,
  useNotificationObserver,
} from "#/hooks/useNotificationObserver";

jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: jest.fn(() => Promise.resolve()),
}));

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
  clearLastNotificationResponse: jest.fn(),
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
    resetReportedNotificationOpens();
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

    const makeResponse = (
      identifier: string,
      data: Record<string, unknown>,
    ) => ({
      notification: { request: { identifier, content: { data } } },
    });

    const openNotification = async (url: string) => {
      (
        Notifications.getLastNotificationResponseAsync as jest.Mock
      ).mockReturnValueOnce(
        Promise.resolve(makeResponse("launch", { url })) as never,
      );
      await renderHook(() => useNotificationObserver());
      jest.advanceTimersByTime(2000);
    };

    /** Renders the hook and returns the response listener it registered. */
    const renderWithListener = async () => {
      await renderHook(() => useNotificationObserver());
      return (
        Notifications.addNotificationResponseReceivedListener as jest.Mock
      ).mock.calls.at(-1)[0] as (response: unknown) => void;
    };

    it("reports the open with the notification's link", async () => {
      const url = "https://www.volksverpetzer.de/analyse/slug/";
      await openNotification(url);

      expect(registerEvent).toHaveBeenCalledTimes(1);
      expect(registerEvent).toHaveBeenCalledWith(url, "Notification Opened");
    });

    it("reports a notification without a link under the primary site", async () => {
      const listener = await renderWithListener();
      listener(makeResponse("reminder", {}));

      expect(registerEvent).toHaveBeenCalledWith("", "Notification Opened");
      jest.advanceTimersByTime(2000);
      expect(router.push).not.toHaveBeenCalled();
    });

    it("reports the launching notification only once", async () => {
      const url = "https://www.volksverpetzer.de/analyse/slug/";
      await openNotification(url);
      const listener = (
        Notifications.addNotificationResponseReceivedListener as jest.Mock
      ).mock.calls.at(-1)[0] as (response: unknown) => void;
      // The same tap delivered again through the listener.
      listener(makeResponse("launch", { url }));

      expect(registerEvent).toHaveBeenCalledTimes(1);
    });

    it("clears the handled response so a JS reload doesn't replay it", async () => {
      await openNotification("https://www.volksverpetzer.de/analyse/slug/");

      expect(Notifications.clearLastNotificationResponse).toHaveBeenCalledTimes(
        1,
      );
    });

    it("still redirects and reports when clearing the response fails", async () => {
      (
        Notifications.clearLastNotificationResponse as jest.Mock
      ).mockImplementationOnce(() => {
        throw new Error("unavailable");
      });
      const url = "https://www.volksverpetzer.de/analyse/slug/";
      await openNotification(url);

      expect(registerEvent).toHaveBeenCalledWith(url, "Notification Opened");
      expect(router.push).toHaveBeenCalledWith("/analyse/slug/");
    });

    it("reports each further notification tapped while running", async () => {
      const listener = await renderWithListener();
      listener(makeResponse("a", { url: "https://www.volksverpetzer.de/a/" }));
      listener(makeResponse("b", { url: "https://www.volksverpetzer.de/b/" }));

      expect(registerEvent).toHaveBeenCalledTimes(2);
    });

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
