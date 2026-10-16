import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";

import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import Body from "#/screens/Home/components/article/Body";
import {
  CHUNK_SIZE,
  FIRST_CHUNK_SIZE,
} from "#/screens/Home/components/article/bodyChunks";
import type { HttpsUrl } from "#/types";

jest.mock("react-native-webview", () => ({ WebView: () => null }));
jest.mock("expo-image", () => ({ Image: () => null }));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Records what each report would carry; the offset getter is only read at
// report time, as in the real ReportingWrapper.
const mockReportIndexes: (() => number)[] = [];
jest.mock(
  "#/screens/Home/components/article/renderer/ReportingWrapper",
  () =>
    function MockReportingWrapper({
      renderIndex,
      indexOffset,
      children,
    }: {
      renderIndex: number;
      indexOffset?: () => number;
      children: React.ReactNode;
    }) {
      mockReportIndexes.push(() => renderIndex + (indexOffset?.() ?? 0));
      return children;
    },
);

const PARAGRAPHS = FIRST_CHUNK_SIZE + 2 * CHUNK_SIZE + 5;
const html = Array.from({ length: PARAGRAPHS }, (_, index) =>
  index === 1
    ? `<p><a href="https://volksverpetzer.de/analyse/lang/#quellen">Zu den Quellen</a></p>`
    : index === PARAGRAPHS - 3
      ? `<h2 id="quellen">Quellen</h2>`
      : `<p>Paragraph ${index}</p>`,
).join("\n");

const articleLink: HttpsUrl = "https://volksverpetzer.de/analyse/lang/";

const bodyElement = (
  properties: {
    anchor?: string;
    onRendered?: () => void;
    onAnchorPress?: (id: string) => void;
    article_content?: string;
  } = {},
) => (
  <SettingsContext.Provider
    value={
      {
        advancedSettings: {
          advancedReporting: { value: true, name: "" },
        },
      } as never
    }
  >
    <Body
      article_content={html}
      article_link={articleLink}
      article_title="Lang"
      slug="lang"
      width={400}
      maxWidth={700}
      headerRefs={{ current: {} }}
      onAnchorPress={jest.fn()}
      onLinkPress={jest.fn()}
      {...properties}
    />
  </SettingsContext.Provider>
);

const renderBody = (properties: Parameters<typeof bodyElement>[0] = {}) =>
  render(bodyElement(properties));

// The rest of the body renders a frame after the first chunk.
const flushChunks = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
};

describe("Body progressive rendering", () => {
  it("renders the first chunk right away and the rest afterwards", async () => {
    const onRendered = jest.fn();
    const { queryByText } = await renderBody({ onRendered });

    expect(queryByText("Paragraph 0")).toBeTruthy();
    expect(queryByText(`Paragraph ${PARAGRAPHS - 1}`)).toBeNull();
    expect(onRendered).not.toHaveBeenCalled();

    await flushChunks();

    expect(queryByText(`Paragraph ${PARAGRAPHS - 1}`)).toBeTruthy();
    expect(onRendered).toHaveBeenCalledTimes(1);
  });

  it("starts from the first chunk again for a new article body", async () => {
    const screen = await renderBody();
    await flushChunks();

    const next = html.replaceAll("Paragraph", "Absatz");
    await screen.rerender(bodyElement({ article_content: next }));
    expect(screen.queryByText("Absatz 0")).toBeTruthy();
    expect(screen.queryByText(`Absatz ${PARAGRAPHS - 1}`)).toBeNull();

    await flushChunks();
    expect(screen.queryByText(`Absatz ${PARAGRAPHS - 1}`)).toBeTruthy();
  });

  it("renders up to a deep-link anchor's chunk right away", async () => {
    const { queryByText } = await renderBody({ anchor: "quellen" });

    expect(queryByText("Quellen")).toBeTruthy();
  });

  it("renders up to a tapped in-article anchor's chunk right away", async () => {
    const onAnchorPress = jest.fn();
    const { getByText, queryByText } = await renderBody({ onAnchorPress });
    expect(queryByText("Quellen")).toBeNull();

    await fireEvent.press(getByText("Zu den Quellen"));

    expect(onAnchorPress).toHaveBeenCalledWith("quellen");
    expect(queryByText("Quellen")).toBeTruthy();
  });

  it("reports blocks by their index in the whole body", async () => {
    mockReportIndexes.length = 0;
    await renderBody();
    await flushChunks();

    const reported = new Set(mockReportIndexes.map((index) => index()));
    // Every paragraph block reports its own position in the whole body
    // (the heading isn't wrapped for reporting); without the chunk offset,
    // later chunks would repeat the first chunk's small indexes.
    const expected = Array.from(
      { length: PARAGRAPHS },
      (_, index) => index,
    ).filter((index) => index !== PARAGRAPHS - 3);
    expect([...reported].sort((a, b) => a - b)).toEqual(expected);
  });
});
