import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";

// Stable mock for expo-image — persists through jest.resetModules() so the
// component and test share the same MockImage reference.
const MockImage = jest.fn(() => null);
jest.mock("expo-image", () => ({ Image: MockImage }));

// UiText passthrough so we can query rendered text
jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

// useAppColorScheme / useCorporateColor mocked globally in jest-setup.ts

const loadSpinner = (loadingAnimation: unknown) => {
  jest.resetModules();
  jest.doMock("#/helpers/AppImages", () => ({
    AppImages: { loadingAnimation },
  }));
  return require("#/components/ui/UiSpinner")
    .default as React.ComponentType<any>;
};

describe("UiSpinner", () => {
  describe("without loadingAnimation → renders ActivityIndicator", () => {
    let Spinner: React.ComponentType<any>;
    beforeEach(() => {
      Spinner = loadSpinner(null);
    });

    it("renders an ActivityIndicator", async () => {
      // testID flows through UiSpinner's ActivityIndicatorProps spread onto the
      // ActivityIndicator; RNTL 14 removed UNSAFE_getByType, so query by testID.
      const { getByTestId } = await render(
        <Spinner testID="activity-indicator" />,
      );
      expect(getByTestId("activity-indicator")).toBeTruthy();
    });

    it("does not render text when text prop is omitted", async () => {
      const { queryByText } = await render(<Spinner />);
      expect(queryByText(/.+/)).toBeNull();
    });

    it("renders text when text prop is provided", async () => {
      const { getByText } = await render(<Spinner text="Lade Artikel..." />);
      expect(getByText("Lade Artikel...")).toBeTruthy();
    });

    it("applies textAlign:center to the text", async () => {
      const { getByText } = await render(<Spinner text="Lade Artikel..." />);
      expect(getByText("Lade Artikel...").props.style).toMatchObject({
        textAlign: "center",
      });
    });

    it("applies gap:10 to the container", async () => {
      const { toJSON } = await render(<Spinner />);
      const flatStyle = ((toJSON() as any).props.style as any[]).flat();
      expect(flatStyle).toContainEqual(expect.objectContaining({ gap: 10 }));
    });
  });

  describe("with loadingAnimation → renders Image", () => {
    let Spinner: React.ComponentType<any>;
    beforeEach(() => {
      Spinner = loadSpinner({ uri: "logo_animated.gif" });
    });

    it("does not render an ActivityIndicator", async () => {
      const { queryByTestId } = await render(
        <Spinner testID="activity-indicator" />,
      );
      expect(queryByTestId("activity-indicator")).toBeNull();
    });

    it("renders an expo-image Image", async () => {
      MockImage.mockClear();
      await render(<Spinner />);
      expect(MockImage).toHaveBeenCalled();
    });

    it("still renders text when text prop is provided", async () => {
      const { getByText } = await render(<Spinner text="Wird geladen..." />);
      expect(getByText("Wird geladen...")).toBeTruthy();
    });
  });
});
