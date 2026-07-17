import { describe, expect, it } from "@jest/globals";

import { buildGiroCodePayload } from "#/helpers/utils/girocode";

describe("buildGiroCodePayload", () => {
  it("builds a valid EPC payload and strips spaces from the IBAN", () => {
    const payload = buildGiroCodePayload({
      name: "Volksverpetzer VVP gUG",
      iban: "DE67 7205 0000 0251 7976 92",
      remittance: "Spende",
      amount: 10,
    });

    expect(payload.split("\n")).toEqual([
      "BCD",
      "002",
      "1",
      "SCT",
      "",
      "Volksverpetzer VVP gUG",
      "DE67720500000251797692",
      "EUR10.00",
      "",
      "",
      "Spende",
    ]);
  });

  it("leaves the amount field empty when no positive amount is given", () => {
    const lines = buildGiroCodePayload({
      name: "Test",
      iban: "AT461200052999199621",
      remittance: "Spende",
    }).split("\n");

    expect(lines[7]).toBe("");
    expect(lines[10]).toBe("Spende");
  });

  it("drops trailing empty fields when there is no remittance", () => {
    const payload = buildGiroCodePayload({
      name: "Test",
      iban: "AT461200052999199621",
    });

    expect(payload.endsWith("SCT\n\nTest\nAT461200052999199621")).toBe(true);
  });

  it("truncates over-long name and remittance fields", () => {
    const lines = buildGiroCodePayload({
      name: "x".repeat(100),
      iban: "DE67720500000251797692",
      remittance: "y".repeat(200),
      amount: 5,
    }).split("\n");

    expect(lines[5]).toHaveLength(70);
    expect(lines[10]).toHaveLength(140);
  });
});
