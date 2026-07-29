import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import ArticleScreen from "#/screens/Home/components/article/Article";
import type { ArticleProperties } from "#/types";

// Analytics / side-effect sinks we assert on.
const mockRegisterEvent = jest.fn();
const mockSetAchievement = jest.fn();
const mockSetScrollPosition = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

// Child components are irrelevant to the scroll-tracking logic under test.
jest.mock("#/screens/Home/components/article/Body", () => jest.fn(() => null));
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
  Achievements: {
    setAchievementValue: (...args: unknown[]) => mockSetAchievement(...args),
  },
}));
jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    getScrollPosition: jest.fn(() => Promise.resolve(0)),
    setScrollPosition: (...args: unknown[]) => mockSetScrollPosition(...args),
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

const article = {
  slug: "afd-fraktion-extrem",
  title: "T",
  imageUrl: "",
  link: "https://volksverpetzer.de/analyse/afd-fraktion-extrem/",
  date: "2025-05-01",
  content: { rendered: "<p>Body</p>" },
} as unknown as ArticleProperties;

// A scroll event 80% down the article (past the 70% FullRead threshold).
const scrollTo80 = {
  nativeEvent: {
    contentOffset: { x: 0, y: 800 },
    contentSize: { height: 1000, width: 400 },
    layoutMeasurement: { height: 800, width: 400 },
  },
};

const renderAndScroll = async (anchor?: string) => {
  const view = await render(
    <ArticleScreen article={article} anchor={anchor} />,
  );
  const scrollView = await view.findByTestId("article-scroll");
  fireEvent.scroll(scrollView, scrollTo80);
  return { view, scrollView };
};

describe("ArticleScreen anchor scroll tracking", () => {
  beforeEach(() => jest.clearAllMocks());

  it("records a FullRead and saves position on a genuine user scroll", async () => {
    await renderAndScroll(undefined);

    expect(mockRegisterEvent).toHaveBeenCalledWith(article.link, "FullRead");
    expect(mockSetAchievement).toHaveBeenCalledWith("reader", true);
    expect(mockSetScrollPosition).toHaveBeenCalled();
  });

  it("suppresses read tracking while auto-aligning on a deep-link anchor", async () => {
    // The programmatic anchor jump drives onScroll; it must not count as a
    // read, grant the achievement, or clobber the saved reading position.
    await renderAndScroll("quellen");

    expect(mockRegisterEvent).not.toHaveBeenCalledWith(
      article.link,
      "FullRead",
    );
    expect(mockSetAchievement).not.toHaveBeenCalled();
    expect(mockSetScrollPosition).not.toHaveBeenCalled();
  });

  it("resumes read tracking once the user takes over scrolling", async () => {
    const { scrollView } = await renderAndScroll("quellen");

    // User drag ends the auto-align; subsequent scrolls are real reading.
    fireEvent(scrollView, "scrollBeginDrag", scrollTo80);
    fireEvent.scroll(scrollView, scrollTo80);

    expect(mockRegisterEvent).toHaveBeenCalledWith(article.link, "FullRead");
    expect(mockSetScrollPosition).toHaveBeenCalled();
  });
});
