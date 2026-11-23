import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Linking from "expo-linking";
import React from "react";

import Statistics from "#/helpers/Statistics";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import Body from "#/screens/Home/components/article/Body";
import type { HttpsUrl } from "#/types";

jest.mock("react-native-webview", () => ({ WebView: () => null }));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
jest.mock("expo-linking", () => ({
  __esModule: true,
  openURL: jest.fn(() => Promise.resolve(true)),
}));
jest.mock("#/helpers/Stores/SourcesStore", () => ({
  __esModule: true,
  default: { onAddSource: jest.fn(() => Promise.resolve()) },
}));
jest.mock("#/helpers/Statistics", () => ({
  __esModule: true,
  default: { countSourceChecked: jest.fn() },
}));
jest.mock("#/constants/Config", () => {
  const actual = jest.requireActual("#/constants/Config").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      wpUrl: "https://volksverpetzer.de",
      enableEngagement: true,
    },
  };
});

const articleLink: HttpsUrl = "https://volksverpetzer.de/analyse/lang/";

const html = [
  `<p><a href="https://example.org/quelle">Externe Quelle</a></p>`,
  `<p><a href="http://example.org/alt">Alte Quelle</a></p>`,
  `<p><a href="https://www.volksverpetzer.de/aktuelles/anderer/">Anderer Artikel</a></p>`,
  `<p><a href="mailto:redaktion@example.org">Schreib uns</a></p>`,
  `<p><a href="tel:+49301234567">Ruf an</a></p>`,
  `<p><a href="file:///C:/Users/x/Downloads/a.pdf">Lokale Datei</a></p>`,
  `<p><a href="http://www.volksverpetzer.de/analyse/lang">Dieser Artikel</a></p>`,
  `<p><a href="https://www.volksverpetzer.de/analyse/lang/#quellen">Zu den Quellen</a></p>`,
  `<h2 id="quellen">Quellen</h2>`,
].join("\n");

const renderBody = async () => {
  const onLinkPress = jest.fn();
  const onAnchorPress = jest.fn();
  const screen = await render(
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
        article_content={html}
        article_link={articleLink}
        article_title="Lang"
        slug="lang"
        width={400}
        maxWidth={700}
        headerRefs={{ current: {} }}
        onAnchorPress={onAnchorPress}
        onLinkPress={onLinkPress}
      />
    </SettingsContext.Provider>,
  );
  return { ...screen, onLinkPress, onAnchorPress };
};

const openURL = Linking.openURL as jest.Mock;
const onAddSource = SourcesStore.onAddSource as jest.Mock;
const countSourceChecked = Statistics.countSourceChecked as jest.Mock;

describe("Body link presses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens an external https link and counts it as a checked source", async () => {
    const { getByText, onLinkPress } = await renderBody();

    await fireEvent.press(getByText("Externe Quelle"));

    expect(onLinkPress).toHaveBeenCalledWith(
      expect.anything(),
      "https://example.org/quelle",
    );
    expect(onAddSource).toHaveBeenCalledWith(
      "https://example.org/quelle",
      "lang",
      "Lang",
    );
    expect(countSourceChecked).toHaveBeenCalledTimes(1);
  });

  it("upgrades an http link to https before opening and tracking it", async () => {
    const { getByText, onLinkPress } = await renderBody();

    await fireEvent.press(getByText("Alte Quelle"));

    expect(onLinkPress).toHaveBeenCalledWith(
      expect.anything(),
      "https://example.org/alt",
    );
    expect(onAddSource).toHaveBeenCalledWith(
      "https://example.org/alt",
      "lang",
      "Lang",
    );
  });

  it("opens another own article without counting it as a source", async () => {
    const { getByText, onLinkPress } = await renderBody();

    await fireEvent.press(getByText("Anderer Artikel"));

    expect(onLinkPress).toHaveBeenCalledWith(
      expect.anything(),
      "https://www.volksverpetzer.de/aktuelles/anderer/",
    );
    expect(onAddSource).not.toHaveBeenCalled();
    expect(countSourceChecked).not.toHaveBeenCalled();
  });

  it("hands a mailto link to the OS", async () => {
    const { getByText, onLinkPress } = await renderBody();

    await fireEvent.press(getByText("Schreib uns"));

    expect(openURL).toHaveBeenCalledWith("mailto:redaktion@example.org");
    expect(onLinkPress).not.toHaveBeenCalled();
    expect(onAddSource).not.toHaveBeenCalled();
  });

  it("logs instead of throwing when the OS can't open a mailto link", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    openURL.mockRejectedValueOnce(new Error("no mail app"));
    const { getByText } = await renderBody();

    await fireEvent.press(getByText("Schreib uns"));

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        "Failed to open link:",
        "mailto:redaktion@example.org",
        expect.any(Error),
      ),
    );
    warn.mockRestore();
  });

  it.each(["Ruf an", "Lokale Datei"])(
    "ignores the unsupported link %s",
    async (text) => {
      const { getByText, onLinkPress, onAnchorPress } = await renderBody();

      await fireEvent.press(getByText(text));

      expect(openURL).not.toHaveBeenCalled();
      expect(onLinkPress).not.toHaveBeenCalled();
      expect(onAnchorPress).not.toHaveBeenCalled();
    },
  );

  it("does not reopen the current article for a link to itself", async () => {
    const { getByText, onLinkPress, onAnchorPress } = await renderBody();

    await fireEvent.press(getByText("Dieser Artikel"));

    expect(onLinkPress).not.toHaveBeenCalled();
    expect(onAnchorPress).not.toHaveBeenCalled();
  });

  it("scrolls to the anchor for a www variant of the current article", async () => {
    const { getByText, onLinkPress, onAnchorPress } = await renderBody();

    await fireEvent.press(getByText("Zu den Quellen"));

    expect(onAnchorPress).toHaveBeenCalledWith("quellen");
    expect(onLinkPress).not.toHaveBeenCalled();
  });
});
