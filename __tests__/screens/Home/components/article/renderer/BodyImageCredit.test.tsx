import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import type { InternalRendererProps, TBlock } from "react-native-render-html";
import RenderHtml, { defaultHTMLElementModels } from "react-native-render-html";

import {
  handleContainerElements,
  handleEmbeddedContent,
  handleImageElements,
  handleRemovableElements,
  handleSpecialElements,
} from "#/screens/Home/components/article/ElementHandlers";
import FigcaptionRenderer from "#/screens/Home/components/article/renderer/FigcaptionRenderer";
import ImageRenderer from "#/screens/Home/components/article/renderer/ImageRenderer";
import type { HttpsUrl } from "#/types";

const mockGetMediaCredit = jest.fn();

jest.mock("expo-image", () => ({
  Image: jest.fn(() => null),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("#/helpers/network/WordPressAPI", () => ({
  __esModule: true,
  default: {
    getMediaCredit: (...args: unknown[]) => mockGetMediaCredit(...args),
  },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

// Real WordPress block markup: images in post content carry their attachment
// id in a wp-image-{id} class, which leads to the Image Source Control credit.
const image = `<img loading="lazy" decoding="async" width="1024" height="536" src="https://www.volksverpetzer.de/wp-content/uploads/2025/09/image-55.png" alt="" class="wp-image-101850" srcset="https://www.volksverpetzer.de/wp-content/uploads/2025/09/image-55.png 1024w" sizes="(max-width: 1024px) 100vw, 1024px" />`;

const captionedHtml = `
<p class="wp-block-paragraph">Intro text</p>
<figure class="wp-block-image size-full">${image}<figcaption class="wp-element-caption"><a href="https://example.com/source#">Link</a></figcaption></figure>
<p class="wp-block-paragraph">After text</p>
`;

const htmlWithoutCaption = `
<p class="wp-block-paragraph">Intro text</p>
<figure class="wp-block-image size-large">${image}</figure>
<p class="wp-block-paragraph">After text</p>
`;

const articleLink: HttpsUrl =
  "https://volksverpetzer.de/aktuelles/blaue-schelle-niederlagen-afd/";

// Mirrors how Body.tsx wires RenderHtml (renderers, element models, visitors).
const renderBody = (html: string) =>
  render(
    <RenderHtml
      source={{ html }}
      contentWidth={400}
      customHTMLElementModels={{
        figcaption: defaultHTMLElementModels.p,
        figure: defaultHTMLElementModels.div,
      }}
      ignoredDomTags={["script", "style", "noscript", "input"]}
      domVisitors={{
        onElement: (element: never) => {
          if (handleEmbeddedContent(element)) return;
          if (handleRemovableElements(element)) return;
          if (handleSpecialElements(element)) return;
          if (handleContainerElements(element)) return;
          handleImageElements(element);
        },
      }}
      renderers={{
        img: (renderProperties: InternalRendererProps<TBlock>) =>
          ImageRenderer({ ...renderProperties, url: articleLink }),
        figcaption: (renderProperties: InternalRendererProps<TBlock>) =>
          FigcaptionRenderer({
            ...renderProperties,
            url: articleLink,
          }),
      }}
    />,
  );

describe("body image credits", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the credit badge over caption-less wp-image-{id} body images", async () => {
    mockGetMediaCredit.mockResolvedValue({ source: "Media Tenor" });
    const { findByLabelText } = await renderBody(htmlWithoutCaption);

    await waitFor(
      () => {
        expect(mockGetMediaCredit).toHaveBeenCalledWith(
          "101850",
          articleLink,
          expect.anything(),
        );
      },
      { timeout: 5000 },
    );
    expect(await findByLabelText("Bildquelle anzeigen")).toBeTruthy();
  });

  it("shows a single credit badge on the caption row for captioned images", async () => {
    mockGetMediaCredit.mockResolvedValue({ source: "Media Tenor" });
    const { findAllByLabelText, findByText } = await renderBody(captionedHtml);

    // The caption itself still renders (it contains a link).
    expect(await findByText("Link")).toBeTruthy();

    const badges = await findAllByLabelText("Bildquelle anzeigen");
    expect(badges).toHaveLength(1);
    // Only the caption row fetches; the image overlay is suppressed.
    await waitFor(
      () => {
        expect(mockGetMediaCredit).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 },
    );
  });

  it("renders no badge when the image has no credit", async () => {
    mockGetMediaCredit.mockResolvedValue(undefined);
    const { queryByLabelText } = await renderBody(htmlWithoutCaption);

    await waitFor(
      () => {
        expect(mockGetMediaCredit).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
    expect(queryByLabelText("Bildquelle anzeigen")).toBeNull();
  });
});
