import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import Config from "#/constants/Config";
import { getRegions } from "#/helpers/network/Action";
import * as Networking from "#/helpers/utils/networking";

jest.mock("#/helpers/utils/networking", () => ({
  __esModule: true,
  createClient: jest.fn().mockReturnValue({}),
  get: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    apiUrl: "https://api.example.com",
    enableActions: true,
  },
}));

describe("ActionEngagement", () => {
  let getSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    getSpy = jest.spyOn(Networking, "get");
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getRegions", () => {
    it("should return empty string if actions are disabled", async () => {
      Config.enableActions = false;

      const result = await getRegions();

      expect(getSpy).not.toHaveBeenCalled();
      expect(result).toBe("");
    });

    it("should return regions data", async () => {
      Config.enableActions = true;
      getSpy.mockResolvedValue("Germany,France,USA");

      const result = await getRegions();

      expect(getSpy).toHaveBeenCalledWith(expect.anything(), "/proxy/regions", {
        responseType: "text",
      });
      expect(result).toBe("Germany,France,USA");
    });

    it("should return empty string if the request fails", async () => {
      Config.enableActions = true;
      const error = new Error("Network error");
      getSpy.mockRejectedValue(error);

      const result = await getRegions();

      expect(consoleErrorSpy).toHaveBeenCalledWith("getRegions error:", error);
      expect(result).toBe("");
    });
  });
});
