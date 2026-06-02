import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import { outBoundLinkPress } from "#/helpers/Linking";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { getLinks } from "#/helpers/network/Engagement";
import { ArticleSourceList } from "#/screens/Home/components/article/ArticleSourceList";
import type { HttpsUrl } from "#/types";

jest.mock("#/components/Icons", () => ({
  ChevronIcon: jest.fn(() => null),
}));

jest.mock("#/components/typography/Heading", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});

const mockConfig = { enableEngagement: true };
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  get default() {
    return mockConfig;
  },
}));

jest.mock("#/helpers/network/Engagement", () => ({
  getLinks: jest.fn(),
}));

jest.mock("#/helpers/Stores/SourcesStore", () => ({
  __esModule: true,
  default: { onAddSource: jest.fn() },
}));

jest.mock("#/helpers/Linking", () => ({
  outBoundLinkPress: jest.fn(),
}));

const mockGetLinks = getLinks as jest.MockedFunction<typeof getLinks>;
const mockOnAddSource = SourcesStore.onAddSource as jest.MockedFunction<
  typeof SourcesStore.onAddSource
>;
const mockOutBoundLinkPress = outBoundLinkPress as jest.MockedFunction<
  typeof outBoundLinkPress
>;

const ARTICLE_LINK = "https://www.volksverpetzer.de/artikel/test" as HttpsUrl;
const SOURCE_URL = "https://example.com/source" as HttpsUrl;

const defaultProps = {
  article_link: ARTICLE_LINK,
  article_title: "Test Artikel",
  slug: "test-artikel",
};

const openCollapsable = (
  getAllByRole: ReturnType<typeof render>["getAllByRole"],
) => {
  fireEvent.press(getAllByRole("button")[0]);
};

describe("ArticleSourceList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig.enableEngagement = true;
    mockGetLinks.mockResolvedValue([]);
  });

  describe("initial render", () => {
    it("renders the Quellen title", () => {
      const { getByText } = render(<ArticleSourceList {...defaultProps} />);
      expect(getByText("Quellen")).toBeTruthy();
    });

    it("does not call getLinks while collapsed", () => {
      render(<ArticleSourceList {...defaultProps} />);
      expect(mockGetLinks).not.toHaveBeenCalled();
    });
  });

  describe("engagement disabled", () => {
    it("shows Keine Daten after opening when engagement is off", () => {
      mockConfig.enableEngagement = false;
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      act(() => openCollapsable(getAllByRole));
      expect(getByText("Keine Daten")).toBeTruthy();
    });

    it("does not call getLinks when engagement is disabled", () => {
      mockConfig.enableEngagement = false;
      const { getAllByRole } = render(<ArticleSourceList {...defaultProps} />);
      act(() => openCollapsable(getAllByRole));
      expect(mockGetLinks).not.toHaveBeenCalled();
    });
  });

  describe("fetching links", () => {
    it("calls getLinks with article_link when opened", async () => {
      const { getAllByRole } = render(<ArticleSourceList {...defaultProps} />);
      act(() => openCollapsable(getAllByRole));
      await waitFor(() =>
        expect(mockGetLinks).toHaveBeenCalledWith(ARTICLE_LINK),
      );
    });

    it("shows Keine Daten when getLinks returns empty array", async () => {
      mockGetLinks.mockResolvedValue([]);
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      act(() => openCollapsable(getAllByRole));
      await waitFor(() => expect(getByText("Keine Daten")).toBeTruthy());
    });

    it("shows link rows when getLinks returns results", async () => {
      mockGetLinks.mockResolvedValue([{ url: SOURCE_URL, visitors: 42 }]);
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      act(() => openCollapsable(getAllByRole));
      await waitFor(() => expect(getByText("42 Clicks")).toBeTruthy());
    });

    it("filters out links with zero visitors", async () => {
      mockGetLinks.mockResolvedValue([
        { url: SOURCE_URL, visitors: 0 },
        { url: "https://example.com/other" as HttpsUrl, visitors: 5 },
      ]);
      const { getAllByRole, queryByText, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      act(() => openCollapsable(getAllByRole));
      await waitFor(() => expect(getByText("5 Clicks")).toBeTruthy());
      expect(queryByText("0 Clicks")).toBeNull();
    });

    it("shows Keine Daten when all links have zero visitors", async () => {
      mockGetLinks.mockResolvedValue([{ url: SOURCE_URL, visitors: 0 }]);
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      act(() => openCollapsable(getAllByRole));
      await waitFor(() => expect(getByText("Keine Daten")).toBeTruthy());
    });
  });

  describe("URL display", () => {
    it("strips query params from the displayed URL", async () => {
      const urlWithQuery =
        "https://example.com/page?utm_source=vvp" as HttpsUrl;
      mockGetLinks.mockResolvedValue([{ url: urlWithQuery, visitors: 3 }]);
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      act(() => openCollapsable(getAllByRole));
      await waitFor(() =>
        expect(getByText("https://example.com/page")).toBeTruthy(),
      );
    });

    it("strips hash fragments from the displayed URL", async () => {
      const urlWithHash = "https://example.com/page#section" as HttpsUrl;
      mockGetLinks.mockResolvedValue([{ url: urlWithHash, visitors: 3 }]);
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      act(() => openCollapsable(getAllByRole));
      await waitFor(() =>
        expect(getByText("https://example.com/page")).toBeTruthy(),
      );
    });
  });

  describe("link press", () => {
    const links = [{ url: SOURCE_URL, visitors: 10 }];

    it("calls outBoundLinkPress with the source url and article_link", async () => {
      mockGetLinks.mockResolvedValue(links);
      const { getAllByRole } = render(<ArticleSourceList {...defaultProps} />);
      act(() => openCollapsable(getAllByRole));
      await waitFor(() =>
        expect(getAllByRole("button").length).toBeGreaterThan(1),
      );
      fireEvent.press(getAllByRole("button")[1]);
      await waitFor(() =>
        expect(mockOutBoundLinkPress).toHaveBeenCalledWith(
          SOURCE_URL,
          ARTICLE_LINK,
        ),
      );
    });

    it("calls SourcesStore.onAddSource when engagement is enabled", async () => {
      mockGetLinks.mockResolvedValue(links);
      const { getAllByRole } = render(<ArticleSourceList {...defaultProps} />);
      act(() => openCollapsable(getAllByRole));
      await waitFor(() =>
        expect(getAllByRole("button").length).toBeGreaterThan(1),
      );
      fireEvent.press(getAllByRole("button")[1]);
      await waitFor(() =>
        expect(mockOnAddSource).toHaveBeenCalledWith(
          SOURCE_URL,
          defaultProps.slug,
          defaultProps.article_title,
        ),
      );
    });
  });
});
