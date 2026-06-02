import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

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

const { getLinks } = jest.requireMock("#/helpers/network/Engagement") as {
  getLinks: jest.Mock;
};
const { onAddSource } = jest.requireMock("#/helpers/Stores/SourcesStore")
  .default as { onAddSource: jest.Mock };
const { outBoundLinkPress } = jest.requireMock("#/helpers/Linking") as {
  outBoundLinkPress: jest.Mock;
};

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
    getLinks.mockResolvedValue([]);
  });

  describe("initial render", () => {
    it("renders the Quellen title", () => {
      const { getByText } = render(<ArticleSourceList {...defaultProps} />);
      expect(getByText("Quellen")).toBeTruthy();
    });

    it("does not call getLinks while collapsed", () => {
      render(<ArticleSourceList {...defaultProps} />);
      expect(getLinks).not.toHaveBeenCalled();
    });
  });

  describe("engagement disabled", () => {
    it("shows Keine Daten after opening when engagement is off", async () => {
      mockConfig.enableEngagement = false;
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      await act(async () => openCollapsable(getAllByRole));
      expect(getByText("Keine Daten")).toBeTruthy();
    });

    it("does not call getLinks when engagement is disabled", async () => {
      mockConfig.enableEngagement = false;
      const { getAllByRole } = render(<ArticleSourceList {...defaultProps} />);
      await act(async () => openCollapsable(getAllByRole));
      expect(getLinks).not.toHaveBeenCalled();
    });
  });

  describe("fetching links", () => {
    it("calls getLinks with article_link when opened", async () => {
      const { getAllByRole } = render(<ArticleSourceList {...defaultProps} />);
      await act(async () => openCollapsable(getAllByRole));
      await waitFor(() => expect(getLinks).toHaveBeenCalledWith(ARTICLE_LINK));
    });

    it("shows Keine Daten when getLinks returns empty array", async () => {
      getLinks.mockResolvedValue([]);
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      await act(async () => openCollapsable(getAllByRole));
      await waitFor(() => expect(getByText("Keine Daten")).toBeTruthy());
    });

    it("shows link rows when getLinks returns results", async () => {
      getLinks.mockResolvedValue([{ url: SOURCE_URL, visitors: 42 }]);
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      await act(async () => openCollapsable(getAllByRole));
      await waitFor(() => expect(getByText("42 Clicks")).toBeTruthy());
    });

    it("filters out links with zero visitors", async () => {
      getLinks.mockResolvedValue([
        { url: SOURCE_URL, visitors: 0 },
        { url: "https://example.com/other" as HttpsUrl, visitors: 5 },
      ]);
      const { getAllByRole, queryByText, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      await act(async () => openCollapsable(getAllByRole));
      await waitFor(() => expect(getByText("5 Clicks")).toBeTruthy());
      expect(queryByText("0 Clicks")).toBeNull();
    });

    it("shows Keine Daten when all links have zero visitors", async () => {
      getLinks.mockResolvedValue([{ url: SOURCE_URL, visitors: 0 }]);
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      await act(async () => openCollapsable(getAllByRole));
      await waitFor(() => expect(getByText("Keine Daten")).toBeTruthy());
    });
  });

  describe("URL display", () => {
    it("strips query params from the displayed URL", async () => {
      const urlWithQuery =
        "https://example.com/page?utm_source=vvp" as HttpsUrl;
      getLinks.mockResolvedValue([{ url: urlWithQuery, visitors: 3 }]);
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      await act(async () => openCollapsable(getAllByRole));
      await waitFor(() =>
        expect(getByText("https://example.com/page")).toBeTruthy(),
      );
    });

    it("strips hash fragments from the displayed URL", async () => {
      const urlWithHash = "https://example.com/page#section" as HttpsUrl;
      getLinks.mockResolvedValue([{ url: urlWithHash, visitors: 3 }]);
      const { getAllByRole, getByText } = render(
        <ArticleSourceList {...defaultProps} />,
      );
      await act(async () => openCollapsable(getAllByRole));
      await waitFor(() =>
        expect(getByText("https://example.com/page")).toBeTruthy(),
      );
    });
  });

  describe("link press", () => {
    const links = [{ url: SOURCE_URL, visitors: 10 }];

    it("calls outBoundLinkPress with the source url and article_link", async () => {
      getLinks.mockResolvedValue(links);
      const { getAllByRole } = render(<ArticleSourceList {...defaultProps} />);
      await act(async () => openCollapsable(getAllByRole));
      await waitFor(() =>
        expect(getAllByRole("button").length).toBeGreaterThan(1),
      );
      fireEvent.press(getAllByRole("button")[1]);
      await waitFor(() =>
        expect(outBoundLinkPress).toHaveBeenCalledWith(
          SOURCE_URL,
          ARTICLE_LINK,
        ),
      );
    });

    it("calls SourcesStore.onAddSource when engagement is enabled", async () => {
      getLinks.mockResolvedValue(links);
      const { getAllByRole } = render(<ArticleSourceList {...defaultProps} />);
      await act(async () => openCollapsable(getAllByRole));
      await waitFor(() =>
        expect(getAllByRole("button").length).toBeGreaterThan(1),
      );
      fireEvent.press(getAllByRole("button")[1]);
      await waitFor(() =>
        expect(onAddSource).toHaveBeenCalledWith(
          SOURCE_URL,
          defaultProps.slug,
          defaultProps.article_title,
        ),
      );
    });
  });
});
