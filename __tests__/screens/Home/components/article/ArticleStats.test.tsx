import { render } from "@testing-library/react-native";

import ArticleStats from "#/screens/Home/components/article/ArticleStats";
import type { HttpsUrl } from "#/types";

jest.mock("expo-keep-awake", () => ({
  useKeepAwake: jest.fn(),
}));

jest.mock("#/components/counter/ViewCounter", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("#/components/counter/ShareCounter", () => ({
  __esModule: true,
  default: () => null,
}));

const mockConfig = { enableEngagement: true };
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  get default() {
    return mockConfig;
  },
}));

const article_link = "https://www.volksverpetzer.de/article/test" as HttpsUrl;

describe("ArticleStats — reading time", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig.enableEngagement = true;
  });

  it("renders reading time with clock icon label when reading_time is set", async () => {
    const { getByText } = await render(
      <ArticleStats article_link={article_link} reading_time={12} />,
    );
    expect(getByText("12 Min.")).toBeTruthy();
  });

  it("does not render reading time when reading_time is undefined", async () => {
    const { queryByText } = await render(
      <ArticleStats article_link={article_link} reading_time={undefined} />,
    );
    expect(queryByText(/Min\./)).toBeNull();
  });

  it("renders reading time even when engagement is disabled", async () => {
    mockConfig.enableEngagement = false;
    const { getByText } = await render(
      <ArticleStats article_link={article_link} reading_time={5} />,
    );
    expect(getByText("5 Min.")).toBeTruthy();
  });

  it("returns nothing when engagement is disabled and reading_time is absent", async () => {
    mockConfig.enableEngagement = false;
    const { toJSON } = await render(
      <ArticleStats article_link={article_link} reading_time={undefined} />,
    );
    expect(toJSON()).toBeNull();
  });
});
