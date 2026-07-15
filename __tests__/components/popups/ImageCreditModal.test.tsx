import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import ImageCreditModal from "#/components/popups/ImageCreditModal";
import { outBoundLinkPress } from "#/helpers/Linking";

// Render children when visible, render nothing when hidden — keeps tests focused
// on the modal's own content rather than react-native-modal internals.
jest.mock("react-native-modal", () =>
  jest.fn(({ isVisible, children }: any) => (isVisible ? children : null)),
);

jest.mock("#/components/Icons", () => ({
  CloseIcon: jest.fn(() => null),
}));

jest.mock("#/components/typography/Heading", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

jest.mock("#/helpers/Linking", () => ({
  outBoundLinkPress: jest.fn(),
}));

// Space and View pass through without mocking — they render native View nodes.

const fullCredit = {
  source: "Media Tenor",
  sourceUrl: "https://example.com/source",
  licence: "CC BY 4.0",
};

describe("ImageCreditModal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when visible", () => {
    it("renders the title", async () => {
      const { getByText } = await render(
        <ImageCreditModal isVisible onClose={onClose} credit={fullCredit} />,
      );
      expect(getByText("Bildquelle")).toBeTruthy();
    });

    it("renders the source, licence and link", async () => {
      const { getByText } = await render(
        <ImageCreditModal isVisible onClose={onClose} credit={fullCredit} />,
      );
      expect(getByText("Media Tenor")).toBeTruthy();
      expect(getByText("CC BY 4.0")).toBeTruthy();
      expect(getByText("https://example.com/source")).toBeTruthy();
    });

    it("omits the licence when absent", async () => {
      const { queryByText } = await render(
        <ImageCreditModal
          isVisible
          onClose={onClose}
          credit={{ source: "Media Tenor" }}
        />,
      );
      expect(queryByText("CC BY 4.0")).toBeNull();
    });

    it("opens the source link when tapped", async () => {
      const { getByText } = await render(
        <ImageCreditModal isVisible onClose={onClose} credit={fullCredit} />,
      );
      await fireEvent.press(getByText("https://example.com/source"));
      expect(outBoundLinkPress).toHaveBeenCalledWith(
        "https://example.com/source",
      );
    });

    it("trims a padded https url before showing/opening it", async () => {
      const { getByText } = await render(
        <ImageCreditModal
          isVisible
          onClose={onClose}
          credit={{ source: "Media Tenor", sourceUrl: "  https://x.test/a  " }}
        />,
      );
      await fireEvent.press(getByText("https://x.test/a"));
      expect(outBoundLinkPress).toHaveBeenCalledWith("https://x.test/a");
    });

    it("does not render a link for a non-https source url", async () => {
      const { queryByText } = await render(
        <ImageCreditModal
          isVisible
          onClose={onClose}
          credit={{ source: "Media Tenor", sourceUrl: "http://insecure.test" }}
        />,
      );
      expect(queryByText("http://insecure.test")).toBeNull();
    });

    it("calls onClose when the close icon button is pressed", async () => {
      const { getByLabelText } = await render(
        <ImageCreditModal isVisible onClose={onClose} credit={fullCredit} />,
      );
      await fireEvent.press(getByLabelText("Schließen"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("when not visible", () => {
    it("renders nothing", async () => {
      const { queryByText } = await render(
        <ImageCreditModal
          isVisible={false}
          onClose={onClose}
          credit={fullCredit}
        />,
      );
      expect(queryByText("Bildquelle")).toBeNull();
      expect(queryByText("Media Tenor")).toBeNull();
    });
  });
});
