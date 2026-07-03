import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
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
    iconOnPrimary: "#FFF",
    iconMuted: "#888",
  },
  dark: {
    surface: "#142228",
    primary: "#3893C0",
    muted: "#333",
    text: "#F7F7F7",
    iconOnPrimary: "#FFF",
    iconMuted: "#666",
  },
}));
jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { container: {}, content: {}, noBackground: {}, row: {} },
}));

// ── Heavy UI components ───────────────────────────────────────────────────────
jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));
jest.mock("#/components/Icons", () => ({
  SearchIcon: jest.fn(() => null),
  SafetyIcon: jest.fn(() => null),
}));

// ── Search sub-components — expose testIDs for assertions ────────────────────

// SearchHeader: expose a real TextInput so tests can type/submit, and surface
// the showFaktenBot state so tests can assert which mode is active.
jest.mock("#/screens/Search/components/SearchHeader", () =>
  jest.fn(({ search, setSearch, setSearchParams, showFaktenBot }: any) => {
    const { Text, TextInput, View } = require("react-native");
    return (
      <View>
        <TextInput
          testID="search-input"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setSearchParams(search)}
        />
        {showFaktenBot && <Text testID="faktenbot-active">faktenbot</Text>}
      </View>
    );
  }),
);

// UiEmptyState: forward testID so tests can assert which tutorial is shown.
jest.mock("#/components/ui/UiEmptyState", () =>
  jest.fn(({ children, testID }: any) => {
    const { Text } = require("react-native");
    return <Text testID={testID}>{children}</Text>;
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
    it("shows the Artikel tab tutorial on initial render", async () => {
      const { queryByTestId } = await render(<SearchScreen />);
      expect(queryByTestId("tutorial-artikel")).not.toBeNull();
      expect(queryByTestId("tutorial-ai")).toBeNull();
    });

    it("does not show FaktenBot header on initial render", async () => {
      const { queryByTestId } = await render(<SearchScreen />);
      expect(queryByTestId("faktenbot-active")).toBeNull();
    });

    it("typing alone does not show results", async () => {
      const { getByTestId, queryByTestId } = await render(<SearchScreen />);
      await fireEvent.changeText(getByTestId("search-input"), "corona");
      expect(queryByTestId("algolia-results")).toBeNull();
      expect(queryByTestId("tutorial-artikel")).not.toBeNull();
    });

    it("shows Algolia results after submitting a 2+ character search", async () => {
      const { getByTestId, queryByTestId } = await render(<SearchScreen />);
      await fireEvent.changeText(getByTestId("search-input"), "co");
      await fireEvent(getByTestId("search-input"), "submitEditing");
      expect(queryByTestId("algolia-results")).not.toBeNull();
      expect(queryByTestId("tutorial-artikel")).toBeNull();
    });

    it("passes the submitted search string to AlgoliaSearchResults", async () => {
      const { getByTestId } = await render(<SearchScreen />);
      await fireEvent.changeText(getByTestId("search-input"), "corona");
      await fireEvent(getByTestId("search-input"), "submitEditing");
      expect(getByTestId("algolia-results").props.children).toBe("corona");
    });
  });

  describe("tab switching", () => {
    it("switches to AI tab when pressing KI-Faktenbot button", async () => {
      const { getByRole, queryByTestId } = await render(<SearchScreen />);
      await fireEvent.press(getByRole("tab", { name: "KI-Faktenbot" }));
      expect(queryByTestId("tutorial-ai")).not.toBeNull();
      expect(queryByTestId("tutorial-artikel")).toBeNull();
    });

    it("activates FaktenBot header when on AI tab", async () => {
      const { getByRole, queryByTestId } = await render(<SearchScreen />);
      await fireEvent.press(getByRole("tab", { name: "KI-Faktenbot" }));
      expect(queryByTestId("faktenbot-active")).not.toBeNull();
    });

    it("switches back to Artikel tab", async () => {
      const { getByRole, queryByTestId } = await render(<SearchScreen />);
      await fireEvent.press(getByRole("tab", { name: "KI-Faktenbot" }));
      await fireEvent.press(getByRole("tab", { name: "Artikel" }));
      expect(queryByTestId("tutorial-artikel")).not.toBeNull();
      expect(queryByTestId("tutorial-ai")).toBeNull();
    });
  });

  describe("AI tab", () => {
    it("typing alone does not trigger AI search", async () => {
      const { getByTestId, getByRole, queryByTestId } = await render(
        <SearchScreen />,
      );
      await fireEvent.press(getByRole("tab", { name: "KI-Faktenbot" }));
      await fireEvent.changeText(getByTestId("search-input"), "corona");
      expect(queryByTestId("ai-results")).toBeNull();
      expect(queryByTestId("tutorial-ai")).not.toBeNull();
    });

    it("shows AI results after submitting", async () => {
      const { getByTestId, getByRole, queryByTestId } = await render(
        <SearchScreen />,
      );
      await fireEvent.press(getByRole("tab", { name: "KI-Faktenbot" }));
      await fireEvent.changeText(getByTestId("search-input"), "corona");
      await fireEvent(getByTestId("search-input"), "submitEditing");
      expect(queryByTestId("ai-results")).not.toBeNull();
    });

    it("passes the submitted string to AISearch", async () => {
      const { getByTestId, getByRole } = await render(<SearchScreen />);
      await fireEvent.press(getByRole("tab", { name: "KI-Faktenbot" }));
      await fireEvent.changeText(getByTestId("search-input"), "corona");
      await fireEvent(getByTestId("search-input"), "submitEditing");
      expect(getByTestId("ai-results").props.children).toBe("corona");
    });
  });
});
