import { render, waitFor } from "@testing-library/react-native";
import React from "react";

import LoadArticlePost from "#/components/loader/LoadArticlePost";
import WordPressAPI from "#/helpers/network/WordPressAPI";

// Mock the WordPress API so we can assert which client the loader talks to:
// the primary static `getPost` vs a per-site `create(baseUrl).getPost`.
jest.mock("#/helpers/network/WordPressAPI", () => {
  const staticGetPost = jest.fn();
  const createdGetPost = jest.fn();
  const create = jest.fn(() => ({ getPost: createdGetPost }));
  return {
    __esModule: true,
    default: {
      getPost: staticGetPost,
      create,
      convertLoadProps: (data: unknown) => data,
      __staticGetPost: staticGetPost,
      __createdGetPost: createdGetPost,
    },
  };
});

jest.mock("#/components/ui/UiSpinner", () => jest.fn(() => null));

jest.mock("#/components/posts/ArticlePost", () =>
  jest.fn(({ article }: { article: { title: string } }) => {
    const { Text } = require("react-native");
    return <Text>{article.title}</Text>;
  }),
);

const api = WordPressAPI as unknown as {
  create: jest.Mock;
  __staticGetPost: jest.Mock;
  __createdGetPost: jest.Mock;
};

describe("LoadArticlePost", () => {
  beforeEach(() => {
    api.create.mockClear();
    api.__staticGetPost.mockReset().mockResolvedValue({ title: "primary" });
    api.__createdGetPost.mockReset().mockResolvedValue({ title: "secondary" });
  });

  it("loads from the primary site when no baseUrl is given", async () => {
    const { getByText } = await render(<LoadArticlePost slug="some-slug" />);

    await waitFor(() => expect(getByText("primary")).toBeTruthy());
    expect(api.__staticGetPost).toHaveBeenCalledWith("some-slug");
    expect(api.create).not.toHaveBeenCalled();
  });

  it("loads from the secondary site's API when baseUrl is given", async () => {
    const { getByText } = await render(
      <LoadArticlePost
        slug="pruefpunkt-slug"
        baseUrl={"https://pruefpunkt.org" as never}
      />,
    );

    await waitFor(() => expect(getByText("secondary")).toBeTruthy());
    expect(api.create).toHaveBeenCalledWith("https://pruefpunkt.org");
    expect(api.__createdGetPost).toHaveBeenCalledWith("pruefpunkt-slug");
    expect(api.__staticGetPost).not.toHaveBeenCalled();
  });
});
