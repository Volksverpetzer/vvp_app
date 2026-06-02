import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";
import { ActivityIndicator } from "react-native";

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

    it("renders an ActivityIndicator", () => {
      const { UNSAFE_getByType } = render(<Spinner />);
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it("does not render text when text prop is omitted", () => {
      const { queryByText } = render(<Spinner />);
      expect(queryByText(/.+/)).toBeNull();
    });

    it("renders text when text prop is provided", () => {
      const { getByText } = render(<Spinner text="Lade Artikel..." />);
      expect(getByText("Lade Artikel...")).toBeTruthy();
    });

    it("applies textAlign:center to the text", () => {
      const { getByText } = render(<Spinner text="Lade Artikel..." />);
      expect(getByText("Lade Artikel...").props.style).toMatchObject({
        textAlign: "center",
      });
    });

    it("applies gap:12 to the container", () => {
      const { toJSON } = render(<Spinner />);
      const flatStyle = ((toJSON() as any).props.style as any[]).flat();
      expect(flatStyle).toContainEqual(expect.objectContaining({ gap: 12 }));
    });
  });

  describe("with loadingAnimation → renders Image", () => {
    let Spinner: React.ComponentType<any>;
    beforeEach(() => {
      Spinner = loadSpinner({ uri: "logo_animated.gif" });
    });

    it("does not render an ActivityIndicator", () => {
      const { UNSAFE_queryAllByType } = render(<Spinner />);
      expect(UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(0);
    });

    it("renders an expo-image Image", () => {
      const { UNSAFE_getByType } = render(<Spinner />);
      expect(UNSAFE_getByType(MockImage)).toBeTruthy();
    });

    it("still renders text when text prop is provided", () => {
      const { getByText } = render(<Spinner text="Wird geladen..." />);
      expect(getByText("Wird geladen...")).toBeTruthy();
    });
  });
});
