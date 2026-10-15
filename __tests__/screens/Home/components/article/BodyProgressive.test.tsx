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

// Shows the index a report would carry instead of the swipe UI.
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
      const { Text: RNText, View: RNView } = jest.requireActual("react-native");
      return (
        <RNView>
          {children}
          <RNText>{`#${renderIndex + (indexOffset?.() ?? 0)}`}</RNText>
        </RNView>
      );
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

const renderBody = (
  properties: {
    anchor?: string;
    onRendered?: () => void;
    onAnchorPress?: (id: string) => void;
  } = {},
) =>
  render(
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
    </SettingsContext.Provider>,
  );

const flushChunks = async () => {
  for (let index = 0; index < 10; index++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
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
    const { getByText } = await renderBody();
    await flushChunks();

    // The last paragraph sits in the last chunk; its index within that
    // chunk alone would be much smaller.
    expect(getByText(`#${PARAGRAPHS - 1}`)).toBeTruthy();
    expect(getByText(`#${FIRST_CHUNK_SIZE}`)).toBeTruthy();
  });
});
