import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";

import { Achievements } from "#/helpers/Achievements";
import {
  markShareIntentUrl,
  resetShareIntentForTests,
} from "#/helpers/ShareIntent";
import SearchManager from "#/screens/Search/components/SearchManager";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://example.com" },
}));
jest.mock("#/helpers/Achievements", () => ({
  Achievements: { setAchievementValue: jest.fn() },
}));
jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: jest.fn(),
}));

const renderManager = (initialSearch?: string) =>
  render(
    <SearchManager initialSearch={initialSearch}>{() => null}</SearchManager>,
  );

describe("SearchManager rechercheur achievement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // A non-URL mark (see the "non-URL share intent" test below) is never
    // consumed by consumeShareIntentUrl and would otherwise leak into later
    // tests, making them order-dependent.
    resetShareIntentForTests();
  });

  it("awards rechercheur when the URL was marked as a share intent", async () => {
    const url = "https://example.com/fake-news";
    markShareIntentUrl(url);

    await renderManager(url);

    expect(Achievements.setAchievementValue).toHaveBeenCalledWith(
      "rechercheur",
    );
  });

  it("does not award rechercheur for a URL typed/pasted directly (no matching share-intent mark)", async () => {
    await renderManager("https://example.com/fake-news");

    expect(Achievements.setAchievementValue).not.toHaveBeenCalledWith(
      "rechercheur",
    );
  });

  it("does not award rechercheur for a non-URL share intent", async () => {
    const text = "just some shared text";
    markShareIntentUrl(text);

    await renderManager(text);

    expect(Achievements.setAchievementValue).not.toHaveBeenCalledWith(
      "rechercheur",
    );
  });

  it("consumes the share-intent mark so it cannot be reused for a later, unrelated URL search", async () => {
    const sharedUrl = "https://example.com/fake-news";
    markShareIntentUrl(sharedUrl);
    await renderManager(sharedUrl);
    (Achievements.setAchievementValue as jest.Mock).mockClear();

    // A second, different URL search (e.g. the user pastes one) must not
    // ride on the already-consumed mark.
    await renderManager("https://example.com/another-link");

    expect(Achievements.setAchievementValue).not.toHaveBeenCalledWith(
      "rechercheur",
    );
  });
});
