import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Linking from "expo-linking";
import type { Router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { onLinkPress, outBoundLinkPress } from "#/helpers/Linking";
import { registerEvent } from "#/helpers/network/Analytics";

// Mock dependencies
jest.mock("expo-linking", () => ({
  __esModule: true,
  parse: jest.fn(),
  openURL: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-web-browser", () => ({
  __esModule: true,
  openBrowserAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("#/helpers/network/Analytics", () => ({
  __esModule: true,
  registerEvent: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
  },
}));

describe("Linking helpers", () => {
  const router = {
    push(_path?: any) {
      /* noop */
    },
  } as unknown as Router;

  let pushSpy: ReturnType<typeof jest.spyOn>;
  let parseSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "ios";

    parseSpy = jest.spyOn(Linking, "parse");
    pushSpy = jest.spyOn(router, "push").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("onLinkPress", () => {
    it("should navigate to internal links with path", () => {
      // Setup
      const internalUrl = "https://www.volksverpetzer.de/politik/some-article";
      parseSpy.mockImplementation((url: string) => {
        if (url === internalUrl) {
          return {
            hostname: "www.volksverpetzer.de",
            path: "/politik/some-article",
          };
        } else {
          return { hostname: "www.volksverpetzer.de", path: "" };
        }
      });

      // Execute
      onLinkPress(internalUrl, router);

      // Assert
      expect(Linking.parse).toHaveBeenCalledWith(internalUrl);
      expect(pushSpy).toHaveBeenCalledWith("/politik/some-article");
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("should treat wp-content/uploads paths as external links", () => {
      // Setup
      const uploadUrl =
        "https://www.volksverpetzer.de/wp-content/uploads/2024/11/file.pdf";
      const articleContext = "https://www.volksverpetzer.de/article";

      parseSpy.mockImplementation((url: string) => {
        if (url === uploadUrl) {
          return {
            hostname: "www.volksverpetzer.de",
            path: "/wp-content/uploads/2024/11/file.pdf",
          };
        } else {
          return { hostname: "www.volksverpetzer.de", path: "" };
        }
      });

      // Execute
      onLinkPress(uploadUrl, router, articleContext);

      // Assert
      expect(Linking.parse).toHaveBeenCalledWith(uploadUrl);
      expect(pushSpy).not.toHaveBeenCalled();
      expect(registerEvent).toHaveBeenCalledWith(
        articleContext,
        "Outbound Link: Click",
        { url: uploadUrl },
      );
      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(uploadUrl);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("should handle internal links without path", () => {
      // Setup
      const internalUrl = "https://www.volksverpetzer.de";
      parseSpy.mockImplementation((url: string) => {
        if (url === internalUrl) {
          return { hostname: "www.volksverpetzer.de", path: "" };
        } else {
          return { hostname: "www.volksverpetzer.de", path: "" };
        }
      });

      // Execute
      onLinkPress(internalUrl, router);

      // Assert
      expect(Linking.parse).toHaveBeenCalledWith(internalUrl);
      expect(pushSpy).toHaveBeenCalledWith("www.volksverpetzer.de");
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("should open external links in browser", () => {
      // Setup
      const externalUrl = "https://example.com/page";
      const articleContext = "https://www.volksverpetzer.de/article";

      parseSpy.mockImplementation((url: string) => {
        if (url === externalUrl) {
          return { hostname: "example.com", path: "/page" };
        } else {
          return { hostname: "www.volksverpetzer.de", path: "" };
        }
      });

      // Execute
      onLinkPress(externalUrl, router, articleContext);

      // Assert
      expect(Linking.parse).toHaveBeenCalledWith(externalUrl);
      expect(pushSpy).not.toHaveBeenCalled();
      expect(registerEvent).toHaveBeenCalledWith(
        articleContext,
        "Outbound Link: Click",
        { url: externalUrl },
      );
      expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith(externalUrl);
    });

    it("should handle paths with trailing slashes", () => {
      // Setup
      const internalUrl = "https://www.volksverpetzer.de/politik/";
      parseSpy.mockImplementation((url: string) => {
        if (url === internalUrl) {
          return { hostname: "www.volksverpetzer.de", path: "/politik/" };
        } else {
          return { hostname: "www.volksverpetzer.de", path: "" };
        }
      });

      // Execute
      onLinkPress(internalUrl, router);

      // Assert
      expect(pushSpy).toHaveBeenCalledWith("/politik");
    });

    it("should handle paths with leading slashes", () => {
      // Setup
      const internalUrl = "https://www.volksverpetzer.de/politik";
      parseSpy.mockImplementation((url: string) => {
        if (url === internalUrl) {
          return { hostname: "www.volksverpetzer.de", path: "/politik" };
        } else {
          return { hostname: "www.volksverpetzer.de", path: "" };
        }
      });

      // Execute
      onLinkPress(internalUrl, router);

      // Assert
      expect(pushSpy).toHaveBeenCalledWith("/politik");
    });
  });

  describe("outBoundLinkPress", () => {
    it("should open URL and register analytics event", () => {
      // Setup
      const externalUrl = "https://example.com";
      const articleContext = "https://www.volksverpetzer.de/article";

      parseSpy.mockImplementation((url: string) => {
        if (url === externalUrl) {
          return { hostname: "example.com", path: "/page" };
        }
        return { hostname: "www.volksverpetzer.de", path: "" };
      });

      // Execute
      outBoundLinkPress(externalUrl, articleContext);

      // Assert
      expect(registerEvent).toHaveBeenCalledWith(
        articleContext,
        "Outbound Link: Click",
        { url: externalUrl },
      );
      expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith(externalUrl);
    });

    it("should handle missing article context", () => {
      // Setup
      const externalUrl = "https://example.com";

      parseSpy.mockImplementation((url: string) => {
        if (url === externalUrl) {
          return { hostname: "example.com", path: "/page" };
        }
        return { hostname: "www.volksverpetzer.de", path: "" };
      });

      // Execute
      outBoundLinkPress(externalUrl);

      // Assert
      expect(registerEvent).toHaveBeenCalledWith(
        undefined,
        "Outbound Link: Click",
        { url: externalUrl },
      );
      expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith(externalUrl);
    });

    it("should open excluded paths via WebBrowser on iOS to avoid App Link recursion", () => {
      const uploadUrl =
        "https://www.volksverpetzer.de/wp-content/uploads/2024/11/file.pdf";

      parseSpy.mockImplementation((url: string) => {
        if (url === uploadUrl) {
          return {
            hostname: "www.volksverpetzer.de",
            path: "/wp-content/uploads/2024/11/file.pdf",
          };
        }
        return { hostname: "www.volksverpetzer.de", path: "" };
      });

      outBoundLinkPress(uploadUrl);

      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(uploadUrl);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("should use intent:// on Android for excluded paths to bypass App Links", () => {
      Platform.OS = "android";
      const uploadUrl =
        "https://www.volksverpetzer.de/wp-content/uploads/2024/11/file.pdf";

      parseSpy.mockImplementation((url: string) => {
        if (url === uploadUrl) {
          return {
            hostname: "www.volksverpetzer.de",
            path: "/wp-content/uploads/2024/11/file.pdf",
          };
        }
        return { hostname: "www.volksverpetzer.de", path: "" };
      });

      outBoundLinkPress(uploadUrl);

      expect(Linking.openURL).toHaveBeenCalledWith(
        "intent://www.volksverpetzer.de/wp-content/uploads/2024/11/file.pdf#Intent;scheme=https;end",
      );
      expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
    });

    it("should fall back to WebBrowser when intent:// fails on Android for excluded paths", async () => {
      Platform.OS = "android";
      const uploadUrl =
        "https://www.volksverpetzer.de/wp-content/uploads/2024/11/file.pdf";

      parseSpy.mockImplementation((url: string) => {
        if (url === uploadUrl) {
          return {
            hostname: "www.volksverpetzer.de",
            path: "/wp-content/uploads/2024/11/file.pdf",
          };
        }
        return { hostname: "www.volksverpetzer.de", path: "" };
      });
      jest
        .mocked(Linking.openURL)
        .mockRejectedValueOnce(new Error("intent unavailable"));

      outBoundLinkPress(uploadUrl);

      await Promise.resolve(); // flush the rejected promise + catch

      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(uploadUrl);
    });
  });
});
