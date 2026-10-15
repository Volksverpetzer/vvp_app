import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import Body from "#/screens/Home/components/article/Body";
import type { HttpsUrl } from "#/types";

jest.mock("react-native-webview", () => ({ WebView: () => null }));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
// The swipe-to-report UI is irrelevant here (and needs native worklets).
jest.mock(
  "#/screens/Home/components/article/renderer/ReportingWrapper",
  () =>
    function MockReportingWrapper({ children }: { children: React.ReactNode }) {
      return children;
    },
);

const articleLink: HttpsUrl = "https://volksverpetzer.de/aktuelles/long-read/";

const renderBody = async (
  onPagePress = jest.fn(),
  onAnchorPress = jest.fn(),
) => {
  const onLinkPress = jest.fn();
  const view = await render(
    <SettingsContext.Provider
      value={
        {
          advancedSettings: {
            advancedReporting: { value: false, name: "" },
          },
        } as never
      }
    >
      <Body
        article_content={
          `<p><a href="${articleLink}3/">Phase 2</a></p>` +
          `<p><a href="${articleLink}4/#quellen%20">Quellen</a></p>` +
          `<p><a href="${articleLink}#oben">Oben</a></p>`
        }
        article_link={articleLink}
        article_title="Chronologie"
        slug="long-read"
        width={400}
        maxWidth={700}
        headerRefs={{ current: {} }}
        onAnchorPress={onAnchorPress}
        onLinkPress={onLinkPress}
        onPagePress={onPagePress}
      />
    </SettingsContext.Provider>,
  );
  return { view, onLinkPress };
};

describe("Body links to the article's own pages", () => {
  it("reports a paged URL of the article as a page press", async () => {
    const onPagePress = jest.fn();
    const { view, onLinkPress } = await renderBody(onPagePress);

    await fireEvent.press(await view.findByText("Phase 2"));

    expect(onPagePress).toHaveBeenCalledWith(3, undefined);
    expect(onLinkPress).not.toHaveBeenCalled();
  });

  it("passes the decoded fragment of a paged URL along", async () => {
    const onPagePress = jest.fn();
    const { view } = await renderBody(onPagePress);

    await fireEvent.press(await view.findByText("Quellen"));

    expect(onPagePress).toHaveBeenCalledWith(4, "quellen ");
  });

  it("keeps plain in-article anchors as anchor presses", async () => {
    const onPagePress = jest.fn();
    const onAnchorPress = jest.fn();
    const { view } = await renderBody(onPagePress, onAnchorPress);

    await fireEvent.press(await view.findByText("Oben"));

    expect(onAnchorPress).toHaveBeenCalledWith("oben");
    expect(onPagePress).not.toHaveBeenCalled();
  });
});
