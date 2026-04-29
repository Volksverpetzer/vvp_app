import { hexToRgb, isDarkMode } from "#/helpers/utils/color";

describe("hexToRgb", () => {
  it("converts 6-digit hex with leading #", () => {
    expect(hexToRgb("#1a2b3c")).toEqual([0x1a, 0x2b, 0x3c]);
  });

  it("converts 6-digit hex without leading #", () => {
    expect(hexToRgb("FFFFFF")).toEqual([255, 255, 255]);
  });

  it("converts 3-digit hex with leading # (expands correctly)", () => {
    expect(hexToRgb("#abc")).toEqual([0xaa, 0xbb, 0xcc]);
  });

  it("supports uppercase letters", () => {
    expect(hexToRgb("#ABC")).toEqual([0xaa, 0xbb, 0xcc]);
  });

  it("converts black correctly", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
  });
});

describe("isDarkMode", () => {
  it("returns true for dark", () => {
    expect(isDarkMode("dark")).toBe(true);
  });

  it("returns false for light", () => {
    expect(isDarkMode("light")).toBe(false);
  });
});
