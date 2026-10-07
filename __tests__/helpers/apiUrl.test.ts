import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Config from "#/constants/Config";
import {
  getApiUrl,
  getApiUrlOverride,
  loadApiUrlOverride,
  normalizeApiUrl,
  setApiUrlOverride,
} from "#/helpers/apiUrl";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { apiUrl: "https://default.example.com", isFoss: true },
}));

describe("apiUrl", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await loadApiUrlOverride();
  });

  describe("normalizeApiUrl", () => {
    it("trims whitespace and trailing slashes", () => {
      expect(normalizeApiUrl("  https://my.server/api/  ")).toBe(
        "https://my.server/api",
      );
    });

    it("rejects non-https and malformed input", () => {
      expect(normalizeApiUrl("http://my.server")).toBeUndefined();
      expect(normalizeApiUrl("my.server")).toBeUndefined();
      expect(normalizeApiUrl("https://")).toBeUndefined();
      expect(normalizeApiUrl("")).toBeUndefined();
    });
  });

  it("falls back to the configured URL without override", () => {
    expect(getApiUrl()).toBe("https://default.example.com");
    expect(getApiUrlOverride()).toBeUndefined();
  });

  it("persists an override and restores it on load", async () => {
    await setApiUrlOverride("https://self.hosted");
    expect(getApiUrl()).toBe("https://self.hosted");

    await setApiUrlOverride(undefined);
    await AsyncStorage.setItem("apiUrlOverride", "https://self.hosted");
    await loadApiUrlOverride();
    expect(getApiUrl()).toBe("https://self.hosted");
  });

  it("clears the override when reset or set to the default", async () => {
    await setApiUrlOverride("https://self.hosted");
    await setApiUrlOverride("https://default.example.com");
    expect(getApiUrlOverride()).toBeUndefined();
    expect(await AsyncStorage.getItem("apiUrlOverride")).toBeNull();
  });

  it("ignores an invalid stored value", async () => {
    await AsyncStorage.setItem("apiUrlOverride", "http://insecure");
    await loadApiUrlOverride();
    expect(getApiUrl()).toBe("https://default.example.com");
  });

  it("ignores a stored override in non-FOSS builds", async () => {
    await AsyncStorage.setItem("apiUrlOverride", "https://self.hosted");
    Config.isFoss = false;
    try {
      await loadApiUrlOverride();
      expect(getApiUrl()).toBe("https://default.example.com");
      expect(getApiUrlOverride()).toBeUndefined();
    } finally {
      Config.isFoss = true;
    }
  });
});
