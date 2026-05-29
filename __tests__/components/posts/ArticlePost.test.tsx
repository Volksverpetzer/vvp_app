import { render } from "@testing-library/react-native";

import ArticlePost from "#/components/posts/ArticlePost";
import type { ArticleProperties, HttpsUrl } from "#/types";

jest.mock("expo-image", () => ({
  Image: () => null,
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

jest.mock("#/components/counter/ViewCounter", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("#/components/ui/UiSpinner", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("#/components/posts/Badge", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { importantCats: {} },
}));

jest.mock("#/helpers/AppImages", () => ({
  AppImages: { loadingAnimation: null },
}));

jest.mock("#/helpers/Linking", () => ({
  onLinkPress: jest.fn(),
}));

jest.mock("#/helpers/Sharing", () => ({
  onShare: jest.fn(),
}));

jest.mock("#/helpers/Stores/ContentStore", () => ({
  __esModule: true,
  default: { setStoredArticle: jest.fn() },
}));

jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: { getScrollPosition: jest.fn().mockResolvedValue(null) },
}));

jest.mock("#/helpers/network/WordPressAPI", () => ({
  __esModule: true,
  default: {
    getFeatureImage: jest.fn().mockResolvedValue({ image: "", thumb: "" }),
  },
}));

jest.mock("#/hooks/useFeedDimensions", () => ({
  useFeedDimensions: () => ({ width: 400 }),
}));

const baseArticle: ArticleProperties = {
  _links: { "wp:featuredmedia": [{ href: "https://example.com/img.jpg" }] },
  date: "2024-06-15T12:00:00Z",
  link: "https://www.volksverpetzer.de/article/test" as HttpsUrl,
  description: "Test description",
  categories: [],
  id: 42,
  slug: "test-article",
  date_gmt: "2024-06-15T12:00:00Z",
  title: "Test Title",
  authors: [{ display_name: "Max Mustermann", slug: "max" }],
};

describe("ArticlePost — reading time", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows reading time in the metadata line when reading_time is set", () => {
    const { getByText } = render(
      <ArticlePost
        article={{ ...baseArticle, reading_time: 12 }}
        inView={false}
      />,
    );
    expect(getByText(/12 Min\./)).toBeTruthy();
  });

  it("does not show reading time when reading_time is undefined", () => {
    const { queryByText } = render(
      <ArticlePost
        article={{ ...baseArticle, reading_time: undefined }}
        inView={false}
      />,
    );
    expect(queryByText(/Min\./)).toBeNull();
  });
});
