import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";

import ArticleScreen from "#/screens/Home/components/article/Article";
import type { ArticleProperties } from "#/types";

const mockRegisterEvent = jest.fn();
const mockSetScrollPosition = jest.fn();
const mockSetScrollPage = jest.fn();
const mockGetScrollPage = jest.fn(() => Promise.resolve(0));

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

// Body reports right away that its (only) chunk is rendered.
jest.mock("#/screens/Home/components/article/Body", () => {
  const { useLayoutEffect } = jest.requireActual("react");
  return jest.fn(({ onRendered }: { onRendered?: () => void }) => {
    useLayoutEffect(() => {
      onRendered?.();
    }, [onRendered]);
    return null;
  });
});
jest.mock("#/screens/Home/components/article/Header", () =>
  jest.fn(() => null),
);
jest.mock("#/screens/Home/components/article/Recommended", () =>
  jest.fn(() => null),
);
jest.mock("#/components/views/Footer", () => jest.fn(() => null));
jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));
jest.mock("#/components/buttons/BackToTopButton", () => jest.fn(() => null));

jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: (...args: unknown[]) => mockRegisterEvent(...args),
}));
jest.mock("#/helpers/network/Engagement", () => ({
  registerViews: jest.fn(),
}));
jest.mock("#/helpers/Achievements", () => ({
  Achievements: { setAchievementValue: jest.fn() },
}));
jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    getScrollPosition: () => Promise.resolve(0),
    setScrollPosition: (...args: unknown[]) => mockSetScrollPosition(...args),
    getScrollPage: () => mockGetScrollPage(),
    setScrollPage: (...args: unknown[]) => mockSetScrollPage(...args),
  },
}));
jest.mock("#/helpers/Statistics", () => ({
  __esModule: true,
  default: { countArticleRead: jest.fn() },
}));
jest.mock("#/helpers/Linking", () => ({ onLinkPress: jest.fn() }));
jest.mock("#/helpers/Sharing", () => ({ onShare: jest.fn() }));
jest.mock("#/helpers/utils/feeds", () => ({
  findSecondaryWpFeed: jest.fn(() => undefined),
}));
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
}));
jest.mock("#/hooks/useBackToTop", () => ({
  useBackToTop: () => ({ onScroll: jest.fn(), visible: false }),
}));
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://volksverpetzer.de", feeds: { wp: [] } },
}));

type BodyProps = {
  article_content: string;
  anchor?: string;
  onAnchorPress: (id: string) => void;
  onPagePress: (pageNumber: number, anchor?: string) => void;
};

const Body = jest.requireMock("#/screens/Home/components/article/Body");
const Recommended = jest.requireMock(
  "#/screens/Home/components/article/Recommended",
);
const Footer = jest.requireMock("#/components/views/Footer");
const bodyProps = () => Body.mock.calls.at(-1)[0] as BodyProps;

const makeArticle = (rendered: string) =>
  ({
    slug: "long-read",
    title: "T",
    imageUrl: "",
    link: "https://volksverpetzer.de/aktuelles/long-read/",
    date: "2025-05-01",
    content: { rendered },
  }) as unknown as ArticleProperties;

const pagedArticle = makeArticle(
  '<p>Intro</p><p>[nextpage title="Phase 1"]</p><h2 id="eins">Eins</h2>' +
    '<p>[nextpage title="Phase 2"]</p><h2 id="zwei">Zwei</h2>',
);

const scrollTo80 = {
  nativeEvent: {
    contentOffset: { x: 0, y: 800 },
    contentSize: { height: 1000, width: 400 },
    layoutMeasurement: { height: 800, width: 400 },
  },
};

describe("ArticleScreen pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetScrollPage.mockResolvedValue(0);
  });

  it("renders an article without markers as a single page", async () => {
    const view = await render(
      <ArticleScreen article={makeArticle("<p>Only</p>")} />,
    );

    expect(bodyProps().article_content).toBe("<p>Only</p>");
    expect(view.queryByTestId("article-toc")).toBeNull();
    expect(view.queryByTestId("article-page-navigation")).toBeNull();
    expect(Recommended).toHaveBeenCalled();
    expect(Footer).toHaveBeenCalled();
    expect(mockSetScrollPage).not.toHaveBeenCalled();
  });

  it("renders one page at a time with Footer only after the last", async () => {
    const view = await render(<ArticleScreen article={pagedArticle} />);

    expect(bodyProps().article_content).toBe("<p>Intro</p>");
    expect(view.getByText("Seite 1 von 3")).toBeTruthy();
    expect(Footer).not.toHaveBeenCalled();
    expect(Recommended).not.toHaveBeenCalled();

    await fireEvent.press(view.getByText("Weiter: Phase 1"));
    expect(bodyProps().article_content).toBe('<h2 id="eins">Eins</h2>');
    expect(mockSetScrollPage).toHaveBeenLastCalledWith(1, "long-read");

    await fireEvent.press(view.getByText("Weiter: Phase 2"));
    expect(bodyProps().article_content).toBe('<h2 id="zwei">Zwei</h2>');
    expect(view.queryByText(/^Weiter:/)).toBeNull();
    expect(view.getByText("Zurück: Phase 1")).toBeTruthy();
    expect(Footer).toHaveBeenCalled();
    expect(Recommended).toHaveBeenCalled();
  });

  it("switches pages from the table of contents", async () => {
    const view = await render(<ArticleScreen article={pagedArticle} />);

    await fireEvent.press(view.getByText("Inhalt · Seite 1 von 3"));
    await fireEvent.press(view.getByText("3. Phase 2"));

    expect(bodyProps().article_content).toBe('<h2 id="zwei">Zwei</h2>');
    expect(view.getByText("Inhalt · Seite 3 von 3")).toBeTruthy();
  });

  it("opens a deep-link anchor on the page containing it", async () => {
    await render(<ArticleScreen article={pagedArticle} anchor="zwei" />);

    expect(bodyProps().article_content).toBe('<h2 id="zwei">Zwei</h2>');
    expect(bodyProps().anchor).toBe("zwei");
    expect(mockSetScrollPage).toHaveBeenLastCalledWith(2, "long-read");
  });

  it("opens the page of a paged deep link", async () => {
    await render(<ArticleScreen article={pagedArticle} page={2} />);

    expect(bodyProps().article_content).toBe('<h2 id="eins">Eins</h2>');
  });

  it("follows an in-article anchor link to another page", async () => {
    await render(<ArticleScreen article={pagedArticle} />);

    await act(() => {
      bodyProps().onAnchorPress("zwei");
    });

    expect(bodyProps().article_content).toBe('<h2 id="zwei">Zwei</h2>');
    expect(bodyProps().anchor).toBe("zwei");
  });

  it("follows a link to one of the article's paged URLs", async () => {
    await render(<ArticleScreen article={pagedArticle} />);

    await act(() => {
      bodyProps().onPagePress(2);
    });
    expect(bodyProps().article_content).toBe('<h2 id="eins">Eins</h2>');

    await act(() => {
      bodyProps().onPagePress(1);
    });
    expect(bodyProps().article_content).toBe("<p>Intro</p>");
  });

  it("resumes on the page the reader left the article on", async () => {
    mockGetScrollPage.mockResolvedValue(2);
    await render(<ArticleScreen article={pagedArticle} />);

    expect(bodyProps().article_content).toBe('<h2 id="zwei">Zwei</h2>');
    // Resuming keeps the saved position on that page.
    expect(mockSetScrollPage).not.toHaveBeenCalled();
    expect(mockSetScrollPosition).not.toHaveBeenCalled();
  });

  it("counts a FullRead only on the last page", async () => {
    const view = await render(<ArticleScreen article={pagedArticle} />);
    const scrollView = await view.findByTestId("article-scroll");

    await fireEvent.scroll(scrollView, scrollTo80);
    expect(mockRegisterEvent).not.toHaveBeenCalledWith(
      pagedArticle.link,
      "FullRead",
    );

    await act(() => {
      bodyProps().onPagePress(3);
    });
    await fireEvent.scroll(scrollView, scrollTo80);
    expect(mockRegisterEvent).toHaveBeenCalledWith(
      pagedArticle.link,
      "FullRead",
    );
  });
});
