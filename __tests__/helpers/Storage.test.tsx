import AsyncStorage from "@react-native-async-storage/async-storage";

import BaseStore from "../../src/helpers/Storage";

// Mock AsyncStorage for testing purposes
jest.mock("@react-native-async-storage/async-storage", () => {
  return {
    setItem: jest.fn().mockResolvedValue(undefined as never),
    getItem: jest.fn().mockResolvedValue(undefined as never),
    getAllKeys: jest.fn().mockResolvedValue([] as never),
    multiRemove: jest.fn().mockResolvedValue(undefined as never),
    // Add other mocked methods as needed
  };
});

describe("BaseStore", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("setItem", () => {
    it("should successfully set an item in AsyncStorage", async () => {
      const key = "testKey";
      const value = "testValue";

      const mockSetItem = jest.fn().mockResolvedValue(undefined as never);
      AsyncStorage.setItem = mockSetItem as never;

      await BaseStore.setItem(key, value);

      expect(mockSetItem).toHaveBeenCalledWith(key, value);
    });

    it("should handle empty string values", async () => {
      const key = "testKey";
      const value = "";

      const mockSetItem = jest.fn().mockResolvedValue(undefined as never);
      AsyncStorage.setItem = mockSetItem as never;

      await BaseStore.setItem(key, value);

      expect(mockSetItem).toHaveBeenCalledWith(key, "");
    });

    it("should handle null values", async () => {
      const key = "testKey";
      const value = undefined;

      const mockSetItem = jest.fn().mockResolvedValue(undefined as never);
      AsyncStorage.setItem = mockSetItem as never;

      await BaseStore.setItem(key, value);

      expect(mockSetItem).toHaveBeenCalledWith(key, undefined);
    });
  });

  describe("getItem", () => {
    it("should retrieve an existing item from AsyncStorage", async () => {
      const key = "testKey";
      const value = "testValue";

      const mockGetItem = jest.fn().mockResolvedValue(value as never);
      AsyncStorage.getItem = mockGetItem as never;

      const result = await BaseStore.getItem(key);

      expect(mockGetItem).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });

    it("should return null if the item does not exist", async () => {
      const key = "nonExistentKey";

      const mockGetItem = jest.fn().mockResolvedValue(undefined as never);
      AsyncStorage.getItem = mockGetItem as never;

      const result = await BaseStore.getItem(key);

      expect(mockGetItem).toHaveBeenCalledWith(key);
      expect(result).toBeUndefined();
    });
  });

  describe("parseJSON", () => {
    it("should parse a valid JSON string correctly", () => {
      const json = '{"name": "John", "age": 30}';
      const defaultValue = {};

      const result = BaseStore.parseJSON(json, defaultValue);

      expect(result).toEqual({ name: "John", age: 30 });
    });

    it("should return the default value if JSON parsing fails", () => {
      const json = '{"invalid: JSON';
      const defaultValue = {};

      const result = BaseStore.parseJSON(json, defaultValue);

      expect(result).toBe(defaultValue);
    });

    it("should handle null or undefined input gracefully", () => {
      const json = undefined;
      const defaultValue = {};

      const result = BaseStore.parseJSON(json, defaultValue);

      expect(result).toBe(defaultValue);
    });

    it("should return the default value if the JSON string is empty", () => {
      const json = "";
      const defaultValue = {};

      const result = BaseStore.parseJSON(json, defaultValue);

      expect(result).toBe(defaultValue);
    });
  });

  describe("removePrefixedItems", () => {
    it("should remove all items with the specified prefix", async () => {
      const prefix = "testPrefix";
      const mockKeys = ["testPrefix1", "testPrefix2", "nonTestKey"];

      // Mock AsyncStorage.getAllKeys
      const mockGetAllKeys = jest.fn().mockResolvedValue(mockKeys as never);
      AsyncStorage.getAllKeys = mockGetAllKeys as never;

      // Mock AsyncStorage.multiRemove
      const mockMultiRemove = jest.fn().mockResolvedValue(undefined as never);
      AsyncStorage.multiRemove = mockMultiRemove as never;

      await BaseStore.removePrefixedItems(prefix);

      expect(mockGetAllKeys).toHaveBeenCalled();
      expect(mockMultiRemove).toHaveBeenCalledWith([
        "testPrefix1",
        "testPrefix2",
      ]);
    });

    it("should handle cases where no items match the prefix", async () => {
      const prefix = "nonExistentPrefix";
      const mockKeys = ["key1", "key2"];
      const mockGetAllKeys = jest.fn().mockResolvedValue(mockKeys as never);
      AsyncStorage.getAllKeys = mockGetAllKeys as never;

      // Mock AsyncStorage.multiRemove
      const mockMultiRemove = jest.fn().mockResolvedValue(undefined as never);
      AsyncStorage.multiRemove = mockMultiRemove as never;

      await BaseStore.removePrefixedItems(prefix);

      expect(mockGetAllKeys).toHaveBeenCalled();
      // Expect no calls to multiRemove since no keys match the prefix
      expect(mockMultiRemove).toHaveBeenCalledWith([]);
    });
  });
});
