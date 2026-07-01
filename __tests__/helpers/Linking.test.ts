import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Linking from "expo-linking";
import type { ImperativeRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import {
  isInternalUploadUrl,
  onLinkPress,
  openExternalDownload,
  outBoundLinkPress,
  parsePath,
} from "#/helpers/Linking";
import { registerEvent } from "#/helpers/network/Analytics";

// Mock dependencies
jest.mock("expo-linking", () => ({
  __esModule: true,
  parse: jest.fn(),
  openURL: jest.fn(),
}));

jest.mock("expo-web-browser", () => ({
  __esModule: true,
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: "opened" })),
}));

jest.mock("#/helpers/network/Analytics", () => ({
  __esModule: true,
  registerEvent: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    feeds: {
      wp: [
        {
          handle: "https://www.volksverpetzer.de",
          label: "Artikel",
          enabled: true,
        },
        {
          handle: "https://www.pruefpunkt.org",
          label: "Prüfpunkt Artikel",
          enabled: true,
        },
      ],
    },
  },
}));

describe("Linking helpers", () => {
  const router = {
    push(_path?: any) {
      /* noop */
    },
  } as unknown as ImperativeRouter;

  let pushSpy: ReturnType<typeof jest.spyOn>;
  let parseSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();

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
      expect(pushSpy).toHaveBeenCalledWith({
        pathname: "/politik/some-article",
        params: { originalUrl: internalUrl },
      });
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("should open wp-content/uploads paths externally (browser tab, not the app)", () => {
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
      // Opened in a Custom Tab (expo-web-browser), not Linking.openURL — the
      // latter could re-trigger the app on Android < 31 and loop.
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
      // A bare-domain internal link (no path) opens the app home rather than
      // pushing the raw hostname as a route, which never matches.
      expect(pushSpy).toHaveBeenCalledWith("/");
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("should navigate to secondary WP (Prüfpunkt) internal links in-app", () => {
      const pruefpunktUrl =
        "https://www.pruefpunkt.org/faktencheck/some-article";
      parseSpy.mockImplementation((url: string) => {
        if (url === pruefpunktUrl) {
          return {
            hostname: "www.pruefpunkt.org",
            path: "/faktencheck/some-article",
          };
        }
        if (url === "https://www.pruefpunkt.org") {
          return { hostname: "www.pruefpunkt.org", path: "" };
        }
        return { hostname: "www.volksverpetzer.de", path: "" };
      });

      onLinkPress(pruefpunktUrl, router);

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: "/faktencheck/some-article",
        params: { originalUrl: pruefpunktUrl },
      });
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
      expect(pushSpy).toHaveBeenCalledWith({
        pathname: "/politik",
        params: { originalUrl: internalUrl },
      });
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
      expect(pushSpy).toHaveBeenCalledWith({
        pathname: "/politik",
        params: { originalUrl: internalUrl },
      });
    });
  });

  describe("parsePath", () => {
    it("returns path with trailing slash for a normal URL", () => {
      parseSpy.mockReturnValue({ path: "/artikel/slug" });
      expect(parsePath("https://www.volksverpetzer.de/artikel/slug")).toBe(
        "artikel/slug/",
      );
    });

    it("preserves existing trailing slash", () => {
      parseSpy.mockReturnValue({ path: "/artikel/slug/" });
      expect(parsePath("https://www.volksverpetzer.de/artikel/slug/")).toBe(
        "artikel/slug/",
      );
    });

    it("collapses trailing-slash redirect variants to the same value", () => {
      // Regression for the EdgelessWebview white-page loop: a WordPress
      // canonical redirect that only toggles the trailing slash must
      // normalize to the same path so the WebView follows it instead of
      // looping back into native navigation.
      parseSpy
        .mockReturnValueOnce({ path: "/aktuelles/slug" })
        .mockReturnValueOnce({ path: "/aktuelles/slug/" });

      const withoutSlash = parsePath(
        "https://www.volksverpetzer.de/aktuelles/slug",
      );
      const withSlash = parsePath(
        "https://www.volksverpetzer.de/aktuelles/slug/",
      );

      expect(withoutSlash).toBe("aktuelles/slug/");
      expect(withSlash).toBe(withoutSlash);
    });

    it("strips multiple leading slashes", () => {
      parseSpy.mockReturnValue({ path: "//artikel/slug/" });
      expect(parsePath("https://www.volksverpetzer.de/artikel/slug/")).toBe(
        "artikel/slug/",
      );
    });

    it("returns empty string for root path", () => {
      parseSpy.mockReturnValue({ path: "/" });
      expect(parsePath("https://www.volksverpetzer.de/")).toBe("");
    });

    it("returns empty string for empty path", () => {
      parseSpy.mockReturnValue({ path: "" });
      expect(parsePath("https://www.volksverpetzer.de")).toBe("");
    });

    it("returns empty string for null path", () => {
      parseSpy.mockReturnValue({ path: null });
      expect(parsePath("https://www.volksverpetzer.de")).toBe("");
    });
  });

  describe("outBoundLinkPress", () => {
    it("should open URL and register analytics event", () => {
      // Setup
      const externalUrl = "https://example.com";
      const articleContext = "https://www.volksverpetzer.de/article";

      // Execute
      outBoundLinkPress(externalUrl, articleContext);

      // Assert
      expect(registerEvent).toHaveBeenCalledWith(
        articleContext,
        "Outbound Link: Click",
        { url: externalUrl },
      );
      expect(Linking.openURL).toHaveBeenCalledWith(externalUrl);
    });

    it("should handle missing article context", () => {
      // Setup
      const externalUrl = "https://example.com";

      // Execute
      outBoundLinkPress(externalUrl);

      // Assert
      expect(registerEvent).toHaveBeenCalledWith(
        undefined,
        "Outbound Link: Click",
        { url: externalUrl },
      );
      expect(Linking.openURL).toHaveBeenCalledWith(externalUrl);
    });
  });

  describe("openExternalDownload", () => {
    it("opens the URL in a browser tab and registers analytics", async () => {
      const uploadUrl =
        "https://www.volksverpetzer.de/wp-content/uploads/2024/11/file.pdf";
      const articleContext = "https://www.volksverpetzer.de/article";

      await openExternalDownload(uploadUrl, articleContext);

      expect(registerEvent).toHaveBeenCalledWith(
        articleContext,
        "Outbound Link: Click",
        { url: uploadUrl },
      );
      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(uploadUrl);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("falls back to Linking.openURL when the browser tab fails", async () => {
      const uploadUrl =
        "https://www.volksverpetzer.de/wp-content/uploads/file.pdf";
      (
        WebBrowser.openBrowserAsync as jest.MockedFunction<
          typeof WebBrowser.openBrowserAsync
        >
      ).mockRejectedValueOnce(new Error("no browser"));

      await openExternalDownload(uploadUrl);

      expect(Linking.openURL).toHaveBeenCalledWith(uploadUrl);
    });

    it("does not reject when both the browser and openURL fail", async () => {
      const uploadUrl =
        "https://www.volksverpetzer.de/wp-content/uploads/file.pdf";
      (
        WebBrowser.openBrowserAsync as jest.MockedFunction<
          typeof WebBrowser.openBrowserAsync
        >
      ).mockRejectedValueOnce(new Error("no browser"));
      (
        Linking.openURL as jest.MockedFunction<typeof Linking.openURL>
      ).mockRejectedValueOnce(new Error("no handler"));

      // Fire-and-forget callers rely on this never rejecting.
      await expect(openExternalDownload(uploadUrl)).resolves.toBeUndefined();
    });
  });

  describe("isInternalUploadUrl", () => {
    it("accepts https uploads URLs on our WordPress hosts", () => {
      expect(
        isInternalUploadUrl(
          "https://www.volksverpetzer.de/wp-content/uploads/2024/11/file.pdf",
        ),
      ).toBe(true);
      // www-insensitive + secondary feed host (pruefpunkt.org)
      expect(
        isInternalUploadUrl(
          "https://pruefpunkt.org/wp-content/uploads/image.jpg",
        ),
      ).toBe(true);
    });

    it("rejects non-uploads paths on our hosts", () => {
      expect(
        isInternalUploadUrl("https://www.volksverpetzer.de/politik/some-slug/"),
      ).toBe(false);
    });

    it("rejects foreign hosts even for an uploads path", () => {
      expect(
        isInternalUploadUrl("https://evil.com/wp-content/uploads/file.pdf"),
      ).toBe(false);
    });

    it("rejects non-https schemes", () => {
      expect(
        isInternalUploadUrl(
          "http://www.volksverpetzer.de/wp-content/uploads/file.pdf",
        ),
      ).toBe(false);
    });

    it("rejects unparseable input", () => {
      expect(isInternalUploadUrl("not a url")).toBe(false);
    });
  });
});
