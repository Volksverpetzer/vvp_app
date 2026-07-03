import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Application from "expo-application";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import Config from "#/constants/Config";
import {
  registerEvent,
  registerPostInteraction,
} from "#/helpers/network/Analytics";
import { registerFav, registerViews } from "#/helpers/network/Engagement";
import * as Networking from "#/helpers/utils/networking";

jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    Version: "15.0",
  },
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
  },
}));

jest.mock("expo-application", () => ({
  __esModule: true,
  nativeBuildVersion: "1.0.0",
}));

jest.mock("expo-linking", () => ({
  __esModule: true,
  parse: jest.fn(),
}));

jest.mock("#/helpers/utils/networking", () => ({
  __esModule: true,
  createClient: jest.fn().mockReturnValue({}),
  post: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    enableAnalytics: true,
    enableEngagement: true,
  },
}));

describe("Analytics (Plausible)", () => {
  let postSpy: ReturnType<typeof jest.spyOn>;
  let parseSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    postSpy = jest.spyOn(Networking, "post");
    parseSpy = jest.spyOn(Linking, "parse");
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("registerEvent", () => {
    it("should send event data to Plausible", async () => {
      parseSpy.mockReturnValue({
        hostname: "www.volksverpetzer.de",
      });
      postSpy.mockResolvedValue({ success: true });

      await registerEvent("https://www.volksverpetzer.de/article", "FullRead", {
        customProp: "value",
      });

      expect(postSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/api/event",
        expect.objectContaining({
          name: "FullRead",
          url: expect.stringContaining("https://www.volksverpetzer.de/article"),
          domain: "volksverpetzer.de",
          props: expect.objectContaining({
            platform: Platform.OS,
            OSversion: Platform.Version,
            appVersion: Application.nativeApplicationVersion,
            appBuild: Application.nativeBuildVersion,
            customProp: "value",
          }),
        }),
      );
    });

    it("should attribute the event to the pruefpunkt site for a pruefpunkt permalink", async () => {
      parseSpy.mockReturnValue({ hostname: "www.pruefpunkt.org" });
      postSpy.mockResolvedValue({ success: true });

      await registerEvent("https://www.pruefpunkt.org/article", "FullRead");

      const [, , body] = postSpy.mock.calls[0];
      expect(body.domain).toBe("pruefpunkt.org");
    });

    it("should include custom UTM parameters", async () => {
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      await registerEvent(
        "https://www.volksverpetzer.de/article",
        "FullRead",
        {},
        "custom_campaign",
        "custom_source",
      );

      const [, , body] = postSpy.mock.calls[0];
      expect(body.url).toEqual(
        expect.stringContaining("utm_source=custom_source"),
      );
      expect(body.url).toEqual(
        expect.stringContaining("utm_campaign=custom_campaign"),
      );
    });

    it("should return early if analytics is disabled", async () => {
      const originalEnableAnalytics = Config.enableAnalytics;
      Config.enableAnalytics = false;

      const result = await registerEvent("https://example.com", "FullRead");

      expect(postSpy).not.toHaveBeenCalled();
      expect(result).toBeUndefined();

      Config.enableAnalytics = originalEnableAnalytics;
    });

    it("should still send events when engagements are disabled", async () => {
      const originalEnableEngagement = Config.enableEngagement;
      Config.enableEngagement = false;
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      await registerEvent("https://example.com", "FullRead");

      expect(postSpy).toHaveBeenCalled();

      Config.enableEngagement = originalEnableEngagement;
    });

    it("should handle errors", async () => {
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      const error = new Error("Network error");
      postSpy.mockRejectedValue(error);

      await registerEvent("https://www.volksverpetzer.de/article", "FullRead");

      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe("wrapper methods", () => {
    it("registerViews should forward to registerEvent", async () => {
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      await registerViews("https://example.com/page");

      const [, , body] = postSpy.mock.calls[0];
      expect(body.name).toBe("pageviews");
    });

    it("registerFav should forward to registerEvent", async () => {
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      await registerFav("https://example.com/page");

      const [, , body] = postSpy.mock.calls[0];
      expect(body.name).toBe("favorite");
    });

    it("registerPostInteraction should forward to registerEvent with platform/action props", async () => {
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      await registerPostInteraction(
        "https://youtu.be/abc123",
        "youtube",
        "play",
      );

      const [, , body] = postSpy.mock.calls[0];
      expect(body.name).toBe("Post Interaction");
      expect(body.props).toEqual(
        expect.objectContaining({
          post_platform: "youtube",
          action: "play",
          // OS platform prop must survive — not overwritten by post_platform
          platform: Platform.OS,
        }),
      );
    });
  });

  describe("type safety", () => {
    it("rejects reserved prop keys and unknown event names at compile time", () => {
      // Never executed — only type-checked by tsc. Each suppression directive
      // below must catch a real error, or tsc fails with "unused directive".
      const typeCheck = () => {
        // @ts-expect-error reserved base prop must not be passed by callers
        registerEvent("https://example.com", "FullRead", { platform: "x" });
        // @ts-expect-error event name must be a member of AnalyticsEvent
        registerEvent("https://example.com", "totally-made-up-event");
      };
      expect(typeof typeCheck).toBe("function");
    });

    it("does not let a widened record overwrite base props at runtime", async () => {
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      // A widened Record slips past the EventProps type guard (as Sharing's
      // `...properties` passthrough would). The spread ordering must still
      // keep the OS platform value intact.
      const widened: Record<string, unknown> = {
        platform: "evil",
        custom: "ok",
      };
      await registerEvent("https://example.com", "FullRead", widened);

      const [, , body] = postSpy.mock.calls[0];
      expect(body.props.platform).toBe(Platform.OS);
      expect(body.props.custom).toBe("ok");
    });
  });
});
