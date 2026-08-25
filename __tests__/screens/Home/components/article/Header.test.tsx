import { render, waitFor } from "@testing-library/react-native";

import AudioPlayer from "#/components/audio/AudioPlayer";
import Header from "#/screens/Home/components/article/Header";
import type { ArticleProperties, HttpsUrl } from "#/types";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

jest.mock("expo-image", () => ({
  Image: () => null,
}));

jest.mock("react-native-view-shot", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef(function ViewShot({ children }: any, ref: any) {
      React.useImperativeHandle(ref, () => ({ capture: jest.fn() }));
      return <>{children}</>;
    }),
  };
});

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
  setUrlAsync: jest.fn(),
}));

const mockConfig = {
  wpUrl: "https://www.volksverpetzer.de",
  importantCats: { 123: "Faktencheck" } as Record<number, string>,
  audioCdnUrl: undefined as HttpsUrl | undefined,
};
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  get default() {
    return mockConfig;
  },
}));

jest.mock("#/helpers/Linking", () => ({
  outBoundLinkPress: jest.fn(),
}));

jest.mock("#/helpers/Sharing", () => ({
  onShare: jest.fn(),
}));

jest.mock("#/screens/Home/components/article/ArticleSourceList", () => ({
  ArticleSourceList: () => null,
}));

jest.mock("#/screens/Home/components/article/ArticleStats", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("#/components/audio/AudioPlayer", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const baseArticle: ArticleProperties = {
  _links: { "wp:featuredmedia": [{ href: "https://example.com/img.jpg" }] },
  date: "2024-01-01T12:00:00Z",
  link: "https://www.volksverpetzer.de/article/test" as HttpsUrl,
  description: "Test description",
  categories: [123],
  id: 42,
  slug: "test-article",
  date_gmt: "2024-01-01T12:00:00Z",
  title: "Test Title",
};

const defaultProps = {
  article: baseArticle,
  article_image: "https://example.com/img.jpg",
  article_title: "Test Article",
  article_link: "https://www.volksverpetzer.de/article/test" as HttpsUrl,
  date: "1. Januar 2024",
  slug: "test-article",
};

const testAuthor = { display_name: "Jane Doe", slug: "jane-doe" };

describe("Header — reading time forwarded to ArticleStats", () => {
  let MockArticleStats: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    MockArticleStats = jest.requireMock(
      "#/screens/Home/components/article/ArticleStats",
    ).default;
  });

  it("passes reading_time to ArticleStats when set", async () => {
    await render(
      <Header
        {...defaultProps}
        article={{ ...baseArticle, reading_time: 8 }}
      />,
    );
    expect(MockArticleStats.mock.calls[0][0]).toMatchObject({
      reading_time: 8,
    });
  });

  it("passes undefined reading_time to ArticleStats when absent", async () => {
    await render(
      <Header
        {...defaultProps}
        article={{ ...baseArticle, reading_time: undefined }}
      />,
    );
    expect(MockArticleStats.mock.calls[0][0]).toMatchObject({
      reading_time: undefined,
    });
  });
});

describe("Header — author byline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the author display name when authors are provided", async () => {
    const { getAllByText } = await render(
      <Header
        {...defaultProps}
        article={{ ...baseArticle, authors: [testAuthor] }}
      />,
    );
    // The name appears in both the article header and the share-preview modal
    expect(getAllByText("Jane Doe").length).toBeGreaterThanOrEqual(1);
  });

  it("hides the author byline when authors is undefined", async () => {
    const { queryByText } = await render(
      <Header
        {...defaultProps}
        article={{ ...baseArticle, authors: undefined }}
      />,
    );
    expect(queryByText(/\bvon\b/)).toBeNull();
  });

  it("hides the author byline when authors is an empty array", async () => {
    const { queryByText } = await render(
      <Header {...defaultProps} article={{ ...baseArticle, authors: [] }} />,
    );
    expect(queryByText(/\bvon\b/)).toBeNull();
  });

  it("always renders the article date regardless of authors", async () => {
    const { getAllByText } = await render(
      <Header
        {...defaultProps}
        article={{ ...baseArticle, authors: undefined }}
      />,
    );
    expect(getAllByText(/1\. Januar 2024/).length).toBeGreaterThanOrEqual(1);
  });
});

describe("Header — AudioPlayer integration", () => {
  const MockAudioPlayer = jest.mocked(AudioPlayer);
  const fetchMock = jest.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    // clearAllMocks resets calls but not a mockResolvedValue/mockRejectedValue
    // implementation, so reset explicitly to avoid a later test silently
    // inheriting an earlier test's fetch behavior.
    fetchMock.mockReset();
    mockConfig.audioCdnUrl = undefined;
    globalThis.fetch = fetchMock;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("does not render AudioPlayer when audioCdnUrl is not configured", async () => {
    await render(<Header {...defaultProps} />);
    expect(MockAudioPlayer).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders AudioPlayer with the correct URL when the audio file exists", async () => {
    mockConfig.audioCdnUrl = "https://vvpaudio.b-cdn.net/audio";
    fetchMock.mockResolvedValue({ ok: true });
    const { queryByText } = await render(<Header {...defaultProps} />);
    await waitFor(() => expect(MockAudioPlayer).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://vvpaudio.b-cdn.net/audio/test-article.mp3",
      expect.objectContaining({ method: "HEAD" }),
    );
    expect(MockAudioPlayer.mock.calls[0][0]).toMatchObject({
      audioUrl: "https://vvpaudio.b-cdn.net/audio/test-article.mp3",
    });
    expect(queryByText(/keine Audioversion verfügbar/)).toBeNull();
  });

  it("strips a trailing slash from audioCdnUrl before building the URL", async () => {
    mockConfig.audioCdnUrl = "https://vvpaudio.b-cdn.net/audio/";
    fetchMock.mockResolvedValue({ ok: true });
    await render(<Header {...defaultProps} />);
    await waitFor(() => expect(MockAudioPlayer).toHaveBeenCalled());
    expect(MockAudioPlayer.mock.calls[0][0]).toMatchObject({
      audioUrl: "https://vvpaudio.b-cdn.net/audio/test-article.mp3",
    });
  });

  it("does not render AudioPlayer and exposes a screen-reader-only hint when the article has no audio file", async () => {
    mockConfig.audioCdnUrl = "https://vvpaudio.b-cdn.net/audio";
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    const { findByLabelText, queryByText } = await render(
      <Header {...defaultProps} />,
    );
    // Announced to screen readers via accessibilityLabel...
    await findByLabelText(/keine Audioversion verfügbar/);
    // ...but not rendered as visible text for sighted users.
    expect(queryByText(/keine Audioversion verfügbar/)).toBeNull();
    expect(MockAudioPlayer).not.toHaveBeenCalled();
  });

  it("renders AudioPlayer when the availability check itself fails (fails open)", async () => {
    mockConfig.audioCdnUrl = "https://vvpaudio.b-cdn.net/audio";
    fetchMock.mockRejectedValue(new Error("network error"));
    await render(<Header {...defaultProps} />);
    await waitFor(() => expect(MockAudioPlayer).toHaveBeenCalled());
  });
});
