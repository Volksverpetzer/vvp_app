import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import ChangelogModal from "#/components/popups/ChangelogModal";

// Render children when visible, render nothing when hidden — keeps tests focused
// on the modal's own content rather than react-native-modal internals.
jest.mock("react-native-modal", () =>
  jest.fn(({ isVisible, children }: any) => (isVisible ? children : null)),
);

jest.mock("#/constants/Changelog", () => ({
  __esModule: true,
  default: {
    version: "2.0.0",
    versionCode: 2000001,
    notes: "- Neue Funktion A\n- Fehlerbehebung B",
  },
}));

jest.mock("#/components/Icons", () => ({
  CloseIcon: jest.fn(() => null),
}));

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

// Space and View pass through without mocking — they render native View nodes.

describe("ChangelogModal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when visible", () => {
    it("renders the heading", async () => {
      const { getByText } = await render(
        <ChangelogModal isVisible onClose={onClose} />,
      );
      expect(getByText("Was ist neu?")).toBeTruthy();
    });

    it("renders the version string", async () => {
      const { getByText } = await render(
        <ChangelogModal isVisible onClose={onClose} />,
      );
      expect(getByText("Version 2.0.0")).toBeTruthy();
    });

    it("renders the changelog notes", async () => {
      const { getByText } = await render(
        <ChangelogModal isVisible onClose={onClose} />,
      );
      expect(getByText("- Neue Funktion A\n- Fehlerbehebung B")).toBeTruthy();
    });

    it("renders the confirm button", async () => {
      const { getByText } = await render(
        <ChangelogModal isVisible onClose={onClose} />,
      );
      expect(getByText("Alles klar")).toBeTruthy();
    });

    it("calls onClose when the close icon button is pressed", async () => {
      const { getByLabelText } = await render(
        <ChangelogModal isVisible onClose={onClose} />,
      );
      await fireEvent.press(getByLabelText("Schließen"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when the confirm button is pressed", async () => {
      const { getByText } = await render(
        <ChangelogModal isVisible onClose={onClose} />,
      );
      await fireEvent.press(getByText("Alles klar"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("when not visible", () => {
    it("renders nothing", async () => {
      const { queryByText } = await render(
        <ChangelogModal isVisible={false} onClose={onClose} />,
      );
      expect(queryByText("Was ist neu?")).toBeNull();
      expect(queryByText("Alles klar")).toBeNull();
    });
  });
});
