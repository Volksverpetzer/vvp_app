import { describe, expect, it } from "@jest/globals";

import { generateDeck, shuffle, truncate } from "#/screens/Games/GameHelper";
import type { DisinfoPair } from "#/types";

describe("truncate", () => {
  it("returns the original string when within the limit", () => {
    expect(truncate("short", 30)).toBe("short");
  });

  it("truncates and appends ellipsis when over the limit", () => {
    const long = "a".repeat(35);
    expect(truncate(long, 30)).toBe("a".repeat(30) + "...");
  });

  it("uses 30 as the default max length", () => {
    const exact = "a".repeat(30);
    expect(truncate(exact)).toBe(exact);
    expect(truncate("a".repeat(31))).toBe("a".repeat(30) + "...");
  });
});

describe("shuffle", () => {
  it("returns an array with the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle([...input]);
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual(input.sort());
  });

  it("returns an empty array for empty input", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("returns a single-element array unchanged", () => {
    expect(shuffle([42])).toEqual([42]);
  });
});

describe("generateDeck", () => {
  const pairs: DisinfoPair[] = [
    {
      pairId: "p1",
      technique: "Strawman",
      misinfo: "Vaccines cause autism",
      factCheck: "https://fact.check/1",
    },
    {
      pairId: "p2",
      technique: "False dilemma",
      misinfo: "Either you agree or you are against us",
      factCheck: "https://fact.check/2",
    },
  ];

  it("generates two cards per pair", () => {
    const deck = generateDeck(pairs);
    expect(deck).toHaveLength(pairs.length * 2);
  });

  it("produces one technique card and one misinfo card per pair", () => {
    const deck = generateDeck(pairs);
    const p1Cards = deck.filter((c) => c.pairId === "p1");
    expect(p1Cards).toHaveLength(2);
    expect(p1Cards.find((c) => c.cardType === "technique")).toBeTruthy();
    expect(p1Cards.find((c) => c.cardType === "misinfo")).toBeTruthy();
  });

  it("sets correct instanceId for each card", () => {
    const deck = generateDeck(pairs);
    const techCard = deck.find(
      (c) => c.pairId === "p1" && c.cardType === "technique",
    );
    const misinfoCard = deck.find(
      (c) => c.pairId === "p1" && c.cardType === "misinfo",
    );
    expect(techCard?.instanceId).toBe("p1-tech");
    expect(misinfoCard?.instanceId).toBe("p1-mis");
  });

  it("sets isFlipped and isMatched to false for all cards", () => {
    const deck = generateDeck(pairs);
    deck.forEach((card) => {
      expect(card.isFlipped).toBe(false);
      expect(card.isMatched).toBe(false);
    });
  });

  it("truncates long misinfo content", () => {
    const longPair: DisinfoPair[] = [
      {
        pairId: "long",
        technique: "Tech",
        misinfo: "x".repeat(50),
        factCheck: "https://fact.check",
      },
    ];
    const deck = generateDeck(longPair);
    const misinfoCard = deck.find((c) => c.cardType === "misinfo");
    expect(misinfoCard?.content).toBe("x".repeat(30) + "...");
    expect(misinfoCard?.fullContent).toBe("x".repeat(50));
  });

  it("passes short misinfo content unchanged", () => {
    const shortPair: DisinfoPair[] = [
      {
        pairId: "short",
        technique: "Tech",
        misinfo: "short text",
        factCheck: "https://fact.check",
      },
    ];
    const deck = generateDeck(shortPair);
    const misinfoCard = deck.find((c) => c.cardType === "misinfo");
    expect(misinfoCard?.content).toBe("short text");
    expect(misinfoCard?.fullContent).toBe("short text");
  });

  it("technique cards carry the factCheck url", () => {
    const deck = generateDeck(pairs);
    const techCard = deck.find(
      (c) => c.pairId === "p1" && c.cardType === "technique",
    );
    expect(techCard?.factCheck).toBe("https://fact.check/1");
  });

  it("returns an empty deck for empty input", () => {
    expect(generateDeck([])).toEqual([]);
  });
});
