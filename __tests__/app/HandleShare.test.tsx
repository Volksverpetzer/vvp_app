import { render, waitFor } from "@testing-library/react-native";
import React from "react";

import HandleShare from "#/app/handle-share";

// Drive the component through the incoming-share hook; capture router.replace.
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Linking.parse strips the fragment and the leading slash — mirror that so the
// component's fragment-recovery path (new URL(...).hash) is what's exercised.
jest.mock("expo-linking", () => ({
  parse: (url: string) => ({
    path: new URL(url).pathname.replace(/^\//, ""),
  }),
  openURL: jest.fn(() => Promise.resolve()),
}));

const mockShare: { value: string; shareType: string } = {
  value: "",
  shareType: "url",
};
jest.mock("expo-sharing", () => ({
  useIncomingShare: () => ({
    error: undefined,
    isResolving: false,
    sharedPayloads: [mockShare],
  }),
  clearSharedPayloads: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    feeds: {
      wp: [
        { handle: "https://volksverpetzer.de", enabled: true },
        { handle: "https://pruefpunkt.org", enabled: true },
      ],
    },
  },
}));

jest.mock("#/helpers/DeepLinkFilter", () => ({
  __esModule: true,
  shouldExcludeFromDeepLink: (path: string) =>
    path.startsWith("/wp-content/uploads/") ||
    path.startsWith("wp-content/uploads/"),
}));

jest.mock("#/helpers/Linking", () => ({
  openExternalDownload: jest.fn(() => Promise.resolve()),
}));

jest.mock("#/components/ui/UiSpinner", () => jest.fn(() => null));
jest.mock("#/components/ui/UiText", () => jest.fn(() => null));

const renderWith = async (value: string) => {
  mockShare.value = value;
  mockShare.shareType = "url";
  await render(<HandleShare />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  return mockReplace.mock.calls.at(-1)?.[0];
};

describe("HandleShare URL routing", () => {
  beforeEach(() => jest.clearAllMocks());

  it("carries the #fragment on a primary-site share", async () => {
    const href = await renderWith(
      "https://volksverpetzer.de/analyse/afd-fraktion-extrem/#quellen",
    );
    expect(href).toBe("/analyse/afd-fraktion-extrem/#quellen");
  });

  it("routes a primary-site share without a fragment unchanged", async () => {
    const href = await renderWith(
      "https://volksverpetzer.de/analyse/afd-fraktion-extrem/",
    );
    expect(href).toBe("/analyse/afd-fraktion-extrem/");
  });

  it("puts originalUrl before the fragment for a secondary-site share", async () => {
    const shared = "https://pruefpunkt.org/faktencheck/bar/#quellen";
    const href = await renderWith(shared);
    // Regression: the object form `params: { "#": … }` corrupted this because
    // expo-router's resolveHref does not encode the "#" key. A string href
    // keeps the query before the fragment so both survive.
    expect(href).toBe(
      `/faktencheck/bar/?originalUrl=${encodeURIComponent(shared)}#quellen`,
    );
  });

  it("appends originalUrl without a fragment for a secondary-site share", async () => {
    const shared = "https://pruefpunkt.org/faktencheck/bar/";
    const href = await renderWith(shared);
    expect(href).toBe(
      `/faktencheck/bar/?originalUrl=${encodeURIComponent(shared)}`,
    );
  });

  it("treats an external URL as a search instead of an anchored route", async () => {
    mockShare.value = "https://example.com/something/#quellen";
    mockShare.shareType = "url";
    await render(<HandleShare />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/search",
      params: { tag: "https://example.com/something/#quellen", share: "1" },
    });
  });
});
