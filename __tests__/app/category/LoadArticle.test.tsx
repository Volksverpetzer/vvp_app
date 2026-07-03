import { render } from "@testing-library/react-native";
import React from "react";

import LoadArticle from "#/app/[category]/[slug]";

// The webview is the fallback surface we assert on; capture its `uri` prop.
jest.mock("#/screens/Home/components/EdgelessWebview", () =>
  jest.fn(() => null),
);
jest.mock("#/screens/Home/components/article/Article", () =>
  jest.fn(() => null),
);
jest.mock("#/components/ui/UiSpinner", () => jest.fn(() => null));

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://volksverpetzer.de", feeds: { wp: [] } },
}));

jest.mock("#/helpers/utils/feeds", () => ({
  findSecondaryWpFeed: jest.fn(() => undefined),
}));

const webviewUri = () => {
  const EdgelessWebview = jest.requireMock(
    "#/screens/Home/components/EdgelessWebview",
  );
  const [props] = EdgelessWebview.mock.calls.at(-1);
  return props.uri as string;
};

describe("LoadArticle single-segment page (no slug)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("builds a trailing-slash URL so WordPress does not 404", () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    useLocalSearchParams.mockReturnValue({
      category: "stellenausschreibung-redaktion",
    });

    render(<LoadArticle />);

    // Regression: the slashless form (…/stellenausschreibung-redaktion) is a
    // hard 404 on the live site; the trailing slash is the canonical permalink.
    expect(webviewUri()).toBe(
      "https://volksverpetzer.de/stellenausschreibung-redaktion/",
    );
  });

  it("prefers the original deep-link URL verbatim when present", () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    useLocalSearchParams.mockReturnValue({
      category: "stellenausschreibung-redaktion",
      originalUrl: "https://volksverpetzer.de/stellenausschreibung-redaktion/",
    });

    render(<LoadArticle />);

    expect(webviewUri()).toBe(
      "https://volksverpetzer.de/stellenausschreibung-redaktion/",
    );
  });
});
