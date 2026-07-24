import { render, waitFor } from "@testing-library/react-native";
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

jest.mock("#/helpers/Stores/ContentStore", () => ({
  __esModule: true,
  default: { getStoredArticle: jest.fn(() => Promise.resolve(null)) },
}));

jest.mock("#/helpers/network/WordPressAPI", () => ({
  __esModule: true,
  default: {
    getPost: jest.fn(() => Promise.resolve(null)),
    create: jest.fn(() => null),
  },
}));

const webviewUri = () => {
  const EdgelessWebview = jest.requireMock(
    "#/screens/Home/components/EdgelessWebview",
  );
  const [props] = EdgelessWebview.mock.calls.at(-1);
  return props.uri as string;
};

const articleAnchorProp = () => {
  const Article = jest.requireMock("#/screens/Home/components/article/Article");
  const [props] = Article.mock.calls.at(-1);
  return props.anchor as string | undefined;
};

describe("LoadArticle single-segment page (no slug)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("builds a trailing-slash URL so WordPress does not 404", async () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    useLocalSearchParams.mockReturnValue({
      category: "stellenausschreibung-redaktion",
    });

    await render(<LoadArticle />);

    // Regression: the slashless form (…/stellenausschreibung-redaktion) is a
    // hard 404 on the live site; the trailing slash is the canonical permalink.
    expect(webviewUri()).toBe(
      "https://volksverpetzer.de/stellenausschreibung-redaktion/",
    );
  });

  it("prefers the original deep-link URL verbatim when present", async () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    useLocalSearchParams.mockReturnValue({
      category: "stellenausschreibung-redaktion",
      originalUrl: "https://volksverpetzer.de/stellenausschreibung-redaktion/",
    });

    await render(<LoadArticle />);

    expect(webviewUri()).toBe(
      "https://volksverpetzer.de/stellenausschreibung-redaktion/",
    );
  });
});

describe("LoadArticle article fallback (slug not found)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("builds a trailing-slash /category/slug/ URL when the API has no post", async () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    useLocalSearchParams.mockReturnValue({
      category: "klima",
      slug: "some-slug",
    });

    // No cached article and no post from the API -> hasError webview fallback.
    await render(<LoadArticle />);

    await waitFor(() => {
      const EdgelessWebview = jest.requireMock(
        "#/screens/Home/components/EdgelessWebview",
      );
      expect(EdgelessWebview).toHaveBeenCalled();
    });

    expect(webviewUri()).toBe("https://volksverpetzer.de/klima/some-slug/");
  });

  it("keeps the deep-link anchor on the fallback URL so the webview jumps to it", async () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    // Custom post types (e.g. /project/…) are not served by the posts API,
    // so anchored deep links to them always land on this fallback.
    useLocalSearchParams.mockReturnValue({
      category: "project",
      slug: "10fakten",
      "#": "quellen",
    });

    await render(<LoadArticle />);

    await waitFor(() => {
      const EdgelessWebview = jest.requireMock(
        "#/screens/Home/components/EdgelessWebview",
      );
      expect(EdgelessWebview).toHaveBeenCalled();
    });

    expect(webviewUri()).toBe(
      "https://volksverpetzer.de/project/10fakten/#quellen",
    );
  });

  it("re-encodes the already-decoded anchor param for the webview URL", async () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    // Contract: useLocalSearchParams has already decodeURIComponent'd every
    // param, so the route receives the raw id (here with a trailing space,
    // as on the live site) and must re-encode it exactly once.
    useLocalSearchParams.mockReturnValue({
      category: "project",
      slug: "10fakten",
      "#": "die-quellen ",
    });

    await render(<LoadArticle />);

    await waitFor(() => {
      const EdgelessWebview = jest.requireMock(
        "#/screens/Home/components/EdgelessWebview",
      );
      expect(EdgelessWebview).toHaveBeenCalled();
    });

    expect(webviewUri()).toBe(
      "https://volksverpetzer.de/project/10fakten/#die-quellen%20",
    );
  });
});

describe("LoadArticle native article anchor", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes the anchor param through to ArticleScreen", async () => {
    // A cached article renders natively (ArticleScreen), which handles the
    // anchor scroll itself — so the fragment must reach it as a prop.
    const ContentStore = jest.requireMock(
      "#/helpers/Stores/ContentStore",
    ).default;
    ContentStore.getStoredArticle.mockResolvedValueOnce({
      slug: "afd-fraktion-extrem",
      imageUrl: "",
    });
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    useLocalSearchParams.mockReturnValue({
      category: "analyse",
      slug: "afd-fraktion-extrem",
      "#": "Erfurter-Resolution",
    });

    await render(<LoadArticle />);

    await waitFor(() => {
      const Article = jest.requireMock(
        "#/screens/Home/components/article/Article",
      );
      expect(Article).toHaveBeenCalled();
    });

    expect(articleAnchorProp()).toBe("Erfurter-Resolution");
  });
});
