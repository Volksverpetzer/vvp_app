import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useFocusEffect } from "expo-router";

import SourcesStore from "#/helpers/Stores/SourcesStore";
import MySources from "#/screens/PersonalTab/components/MySources";

jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children, renderRightActions }: any) => (
      <View>
        {children}
        {renderRightActions?.({}, {}, { close: jest.fn() })}
      </View>
    ),
    SwipeDirection: { LEFT: "left", RIGHT: "right" },
  };
});

jest.mock("#/components/actions/RightAction", () => {
  const { Pressable, Text } = require("react-native");
  return ({ onAction }: any) => (
    <Pressable onPress={onAction} accessibilityLabel="Löschen">
      <Text>Löschen</Text>
    </Pressable>
  );
});

jest.mock("#/helpers/Stores/SourcesStore", () => ({
  __esModule: true,
  default: {
    getAllSources: jest.fn(),
    removeSource: jest.fn(),
  },
}));

jest.mock("#/helpers/Linking", () => ({
  outBoundLinkPress: jest.fn(),
}));

jest.mock("#/components/Icons", () => ({
  DeleteIcon: jest.fn(() => null),
  LinkIcon: jest.fn(() => null),
}));

const sources = {
  "https://example.com/source-a1": {
    slug: "article-a",
    text: "Article A",
    date: "2024-01-01T10:00:00.000Z",
  },
  "https://example.com/source-a2": {
    slug: "article-a",
    text: "Article A",
    date: "2024-01-02T10:00:00.000Z",
  },
  "https://example.com/source-b": {
    slug: "article-b",
    text: "Article B",
    date: "2024-01-03T10:00:00.000Z",
  },
};

describe("MySources", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useFocusEffect).mockImplementation((cb) => {
      cb();
    });
    jest.mocked(SourcesStore.getAllSources).mockResolvedValue(sources as any);
    jest.mocked(SourcesStore.removeSource).mockResolvedValue(undefined);
  });

  it("groups sources by slug, showing one heading per article", async () => {
    const { queryAllByText } = render(<MySources />);
    await waitFor(() => {
      expect(queryAllByText("Article A")).toHaveLength(1);
      expect(queryAllByText("Article B")).toHaveLength(1);
    });
  });

  it("renders all URLs belonging to a slug group", async () => {
    const { getByText } = render(<MySources />);
    await waitFor(() => {
      expect(getByText("https://example.com/source-a1")).toBeTruthy();
      expect(getByText("https://example.com/source-a2")).toBeTruthy();
      expect(getByText("https://example.com/source-b")).toBeTruthy();
    });
  });

  it("removes only the tapped entry and keeps the rest visible", async () => {
    const { getAllByLabelText, queryByText } = render(<MySources />);

    await waitFor(() => {
      expect(getAllByLabelText("Löschen").length).toBe(3);
    });

    // Groups sort newest-first: article-b [0], article-a source-a2 [1], source-a1 [2]
    // Press [1] to delete source-a2 while leaving source-a1 in the same group
    fireEvent.press(getAllByLabelText("Löschen")[1]);

    await waitFor(() => {
      expect(SourcesStore.removeSource).toHaveBeenCalledTimes(1);
      expect(SourcesStore.removeSource).toHaveBeenCalledWith(
        "https://example.com/source-a2",
      );
      expect(queryByText("https://example.com/source-a2")).toBeNull();
      expect(queryByText("https://example.com/source-a1")).toBeTruthy();
      expect(queryByText("https://example.com/source-b")).toBeTruthy();
    });
  });
});
