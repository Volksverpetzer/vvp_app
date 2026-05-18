import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";

import SearchScreen from "#/app/search";

// ── expo-router ──────────────────────────────────────────────────────────────
jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: jest.fn(),
}));

// ── Config / state deps used by SearchManager ────────────────────────────────
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://example.com" },
}));
jest.mock("#/helpers/Achievements", () => ({
  Achievements: { setAchievementValue: jest.fn() },
}));
jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: jest.fn(),
}));

// ── Styling / colors ─────────────────────────────────────────────────────────
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));
jest.mock("#/constants/Colors", () => ({
  light: {
    surface: "#E2F0F5",
    primary: "#1B7194",
    muted: "#BBB",
    text: "#111",
  },
  dark: {
    surface: "#142228",
    primary: "#3893C0",
    muted: "#333",
    text: "#F7F7F7",
  },
}));
jest.mock("#/constants/Styles", () => ({
  styles: { container: {}, content: {}, noBackground: {}, row: {} },
}));

// ── Heavy UI components ───────────────────────────────────────────────────────
jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));
jest.mock("#/components/Icons", () => ({
  SearchIcon: jest.fn(() => null),
  SafetyIcon: jest.fn(() => null),
}));
jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

// ── Search sub-components — expose testIDs for assertions ────────────────────

// SearchHeader: expose a real TextInput so tests can type/submit, and surface
// the showFaktenBot state so tests can assert which mode is active.
jest.mock("#/screens/Search/components/SearchHeader", () =>
  jest.fn(({ search, setSearch, onSubmit, showFaktenBot }: any) => {
    const { Text, TextInput, View } = require("react-native");
    return (
      <View>
        <TextInput
          testID="search-input"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSubmit}
        />
        {showFaktenBot && <Text testID="faktenbot-active">faktenbot</Text>}
      </View>
    );
  }),
);

// SearchTutorial: surface the `tab` prop so tests can assert which tutorial is shown.
jest.mock("#/screens/Search/components/SearchTutorial", () =>
  jest.fn(({ tab }: any) => {
    const { Text } = require("react-native");
    return <Text testID={`tutorial-${tab ?? "artikel"}`}>{tab}</Text>;
  }),
);

// AlgoliaSearchResults: expose testID + the search string being passed.
jest.mock("#/screens/Search/components/AlgoliaSearch", () =>
  jest.fn(({ searchString }: any) => {
    const { Text } = require("react-native");
    return <Text testID="algolia-results">{searchString}</Text>;
  }),
);

// AISearch: expose testID + the search string being passed.
jest.mock("#/screens/Search/components/AISearch", () =>
  jest.fn(({ search }: any) => {
    const { Text } = require("react-native");
    return <Text testID="ai-results">{search}</Text>;
  }),
);

// ─────────────────────────────────────────────────────────────────────────────

describe("SearchScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("default state (Artikel tab)", () => {
    it("shows the Artikel tab tutorial on initial render", () => {
      const { queryByTestId } = render(<SearchScreen />);
      expect(queryByTestId("tutorial-artikel")).not.toBeNull();
      expect(queryByTestId("tutorial-ai")).toBeNull();
    });

    it("does not show FaktenBot header on initial render", () => {
      const { queryByTestId } = render(<SearchScreen />);
      expect(queryByTestId("faktenbot-active")).toBeNull();
    });

    it("shows Algolia results once search has 2+ characters", () => {
      const { getByTestId, queryByTestId } = render(<SearchScreen />);
      fireEvent.changeText(getByTestId("search-input"), "co");
      expect(queryByTestId("algolia-results")).not.toBeNull();
      expect(queryByTestId("tutorial-artikel")).toBeNull();
    });

    it("hides Algolia results and shows tutorial when search drops below 2 chars", () => {
      const { getByTestId, queryByTestId } = render(<SearchScreen />);
      fireEvent.changeText(getByTestId("search-input"), "co");
      fireEvent.changeText(getByTestId("search-input"), "c");
      expect(queryByTestId("algolia-results")).toBeNull();
      expect(queryByTestId("tutorial-artikel")).not.toBeNull();
    });

    it("passes the current search string to AlgoliaSearchResults", () => {
      const { getByTestId } = render(<SearchScreen />);
      fireEvent.changeText(getByTestId("search-input"), "corona");
      expect(getByTestId("algolia-results").props.children).toBe("corona");
    });
  });

  describe("tab switching", () => {
    it("switches to AI tab when pressing KI-Faktenbot button", () => {
      const { getByText, queryByTestId } = render(<SearchScreen />);
      fireEvent.press(getByText("KI-Faktenbot"));
      expect(queryByTestId("tutorial-ai")).not.toBeNull();
      expect(queryByTestId("tutorial-artikel")).toBeNull();
    });

    it("activates FaktenBot header when on AI tab", () => {
      const { getByText, queryByTestId } = render(<SearchScreen />);
      fireEvent.press(getByText("KI-Faktenbot"));
      expect(queryByTestId("faktenbot-active")).not.toBeNull();
    });

    it("switches back to Artikel tab", () => {
      const { getByText, queryByTestId } = render(<SearchScreen />);
      fireEvent.press(getByText("KI-Faktenbot"));
      fireEvent.press(getByText("Artikel"));
      expect(queryByTestId("tutorial-artikel")).not.toBeNull();
      expect(queryByTestId("tutorial-ai")).toBeNull();
    });
  });

  describe("AI tab debounce", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("does not show AISearch immediately after typing", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <SearchScreen />,
      );
      fireEvent.press(getByText("KI-Faktenbot"));
      fireEvent.changeText(getByTestId("search-input"), "corona");
      expect(queryByTestId("ai-results")).toBeNull();
      expect(queryByTestId("tutorial-ai")).not.toBeNull();
    });

    it("shows AISearch after 800ms debounce", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <SearchScreen />,
      );
      fireEvent.press(getByText("KI-Faktenbot"));
      fireEvent.changeText(getByTestId("search-input"), "corona");
      act(() => {
        jest.advanceTimersByTime(800);
      });
      expect(queryByTestId("ai-results")).not.toBeNull();
    });

    it("resets debounce timer when search changes mid-flight", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <SearchScreen />,
      );
      fireEvent.press(getByText("KI-Faktenbot"));
      fireEvent.changeText(getByTestId("search-input"), "coro");
      act(() => jest.advanceTimersByTime(400));
      // Change search again — should reset the 800ms timer
      fireEvent.changeText(getByTestId("search-input"), "corona");
      act(() => jest.advanceTimersByTime(400));
      // Only 400ms since last change — still debouncing
      expect(queryByTestId("ai-results")).toBeNull();
      act(() => jest.advanceTimersByTime(400));
      // Now 800ms since last change — fires
      expect(queryByTestId("ai-results")).not.toBeNull();
    });

    it("clears AI results when search is cleared", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <SearchScreen />,
      );
      fireEvent.press(getByText("KI-Faktenbot"));
      fireEvent.changeText(getByTestId("search-input"), "corona");
      act(() => jest.advanceTimersByTime(800));
      expect(queryByTestId("ai-results")).not.toBeNull();
      fireEvent.changeText(getByTestId("search-input"), "");
      expect(queryByTestId("ai-results")).toBeNull();
    });

    it("submit bypasses debounce and triggers AI search immediately", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <SearchScreen />,
      );
      fireEvent.press(getByText("KI-Faktenbot"));
      fireEvent.changeText(getByTestId("search-input"), "corona");
      // No timer advance — use submit to bypass debounce
      fireEvent(getByTestId("search-input"), "submitEditing");
      expect(queryByTestId("ai-results")).not.toBeNull();
    });

    it("passes the debounced string to AISearch", () => {
      const { getByTestId, getByText } = render(<SearchScreen />);
      fireEvent.press(getByText("KI-Faktenbot"));
      fireEvent.changeText(getByTestId("search-input"), "corona");
      act(() => jest.advanceTimersByTime(800));
      expect(getByTestId("ai-results").props.children).toBe("corona");
    });
  });
});
