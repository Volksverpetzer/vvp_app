import { hexToRgb } from "../../src/helpers/utils/color";

describe("hexToRgb", () => {
  it("konvertiert 6-stellige Hex mit führendem #", () => {
    expect(hexToRgb("#1a2b3c")).toEqual([0x1a, 0x2b, 0x3c]);
  });

  it("konvertiert 6-stellige Hex ohne führendes #", () => {
    expect(hexToRgb("FFFFFF")).toEqual([255, 255, 255]);
  });

  it("konvertiert 3-stellige Hex mit führendem # (Expands korrekt)", () => {
    expect(hexToRgb("#abc")).toEqual([0xaa, 0xbb, 0xcc]);
  });

  it("unterstützt Großbuchstaben", () => {
    expect(hexToRgb("#ABC")).toEqual([0xaa, 0xbb, 0xcc]);
  });

  it("konvertiert black korrekt", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
  });
});
