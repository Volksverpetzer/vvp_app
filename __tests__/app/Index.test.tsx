import { render, waitFor } from "@testing-library/react-native";
import React from "react";

import Index from "#/app/index";
import { claimAppLaunch, resetAppLaunchForTests } from "#/helpers/AppStart";

const mockDismissTo = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ dismissTo: mockDismissTo, replace: mockReplace }),
}));

const mockGetInitialURL = jest.fn<Promise<string | null>, []>();
const mockOpenURL = jest.fn((_url: string) => Promise.resolve());
jest.mock("expo-linking", () => ({
  getInitialURL: () => mockGetInitialURL(),
  openURL: (url: string) => mockOpenURL(url),
  parse: (url: string) => {
    const parsed = new URL(url);
    return {
      hostname: parsed.hostname,
      path: parsed.pathname.replace(/^\//, "") || null,
    };
  },
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://www.volksverpetzer.de" },
}));

const mockCountAppOpened = jest.fn();
jest.mock("#/helpers/Statistics", () => ({
  __esModule: true,
  default: { countAppOpened: () => mockCountAppOpened() },
}));

const mockClear = jest.fn();
jest.mock("#/helpers/Stores/ContentStore", () => ({
  __esModule: true,
  default: { clear: () => mockClear() },
}));

jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: { isOnboardingDone: jest.fn(() => Promise.resolve(true)) },
}));

jest.mock("#/components/ui/UiSpinner", () => jest.fn(() => null));

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("Index start URL handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Each test starts as a fresh app process.
    resetAppLaunchForTests();
  });

  it("leaves an article cold-start link to the router", async () => {
    mockGetInitialURL.mockResolvedValue(
      "https://volksverpetzer.de/analyse/some-article/",
    );
    await render(<Index />);
    await waitFor(() => expect(mockCountAppOpened).toHaveBeenCalledTimes(1));
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it("goes home on a later mount instead of re-reading the article start URL", async () => {
    mockGetInitialURL.mockResolvedValue(
      "https://volksverpetzer.de/analyse/some-article/",
    );
    const first = await render(<Index />);
    await waitFor(() => expect(mockCountAppOpened).toHaveBeenCalledTimes(1));
    await first.unmount();

    await render(<Index />);
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith("/home"));
    expect(mockCountAppOpened).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  it("does not reopen an excluded start URL on a later mount", async () => {
    mockGetInitialURL.mockResolvedValue(
      "https://volksverpetzer.de/wp-content/uploads/file.pdf",
    );
    const first = await render(<Index />);
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledTimes(1));
    await first.unmount();

    await render(<Index />);
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledTimes(2));
    await flush();
    expect(mockOpenURL).toHaveBeenCalledTimes(1);
    expect(mockCountAppOpened).toHaveBeenCalledTimes(1);
  });

  it("runs the app-open routine once across a plain launch and onboarding finish", async () => {
    mockGetInitialURL.mockResolvedValue(null);
    const first = await render(<Index />);
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledTimes(1));
    await first.unmount();

    await render(<Index />);
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledTimes(2));
    expect(mockCountAppOpened).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  it("goes home on its first mount when native-intent already claimed the launch", async () => {
    // Deep-link cold start: the router opened the article directly, so Index
    // first mounts only when something later navigates to "/".
    mockGetInitialURL.mockResolvedValue(
      "https://volksverpetzer.de/analyse/some-article/",
    );
    claimAppLaunch();

    await render(<Index />);
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith("/home"));
    expect(mockGetInitialURL).not.toHaveBeenCalled();
    expect(mockCountAppOpened).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
  });
});
