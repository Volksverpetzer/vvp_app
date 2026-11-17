import { describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";

import Feed from "#/screens/Home/components/Feed";

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn() }),
  useScrollToTop: () => {},
}));

jest.mock("#/components/Icons", () => ({
  SearchIcon: () => null,
  SettingsIcon: () => null,
}));

// Capture the props Feed hands to FlatList (data, onEndReached).
let lastListProps: any;
jest.mock("react-native/Libraries/Lists/FlatList", () => {
  const React = require("react");
  const ActualFlatList = jest.requireActual<{ default: any }>(
    "react-native/Libraries/Lists/FlatList",
  ).default;
  const MockFlatList = React.forwardRef((props: any, ref: any) => {
    lastListProps = props;
    return <ActualFlatList ref={ref} {...props} />;
  });
  MockFlatList.displayName = "MockFlatList";
  return { __esModule: true, default: MockFlatList };
});

jest.mock("#/components/ui/UiSpinner", () => () => null);
jest.mock("#/components/views/EmptyComponent", () => () => null);
jest.mock("#/components/posts/GenericPost", () => () => null);
jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
}));
jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { corporate: "#000", secondaryBackground: "#fff" },
    dark: { corporate: "#000", secondaryBackground: "#fff" },
  },
}));
jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: {
    feed: {},
    centered: {},
    heading: {},
    content: {},
    noBackground: {},
  },
}));

const post = (id: string, day: number) =>
  ({
    id,
    datetime: `2026-11-${String(day).padStart(2, "0")}T00:00:00Z`,
    priority: 0,
  }) as any;

const ids = (list: any[]) => list.map((p) => p.id);

describe("Feed load-more with the date cutoff", () => {
  it("shows posts the first-page cutoff held back and keeps every load-more page", async () => {
    // Paginated WP feed: page 1 covers days 20..11, page 2 days 10..1.
    const wpPages: Record<number, any[]> = {
      1: [20, 18, 16, 14, 12, 11].map((d) => post(`wp${d}`, d)),
      2: [10, 8, 6, 4, 2].map((d) => post(`wp${d}`, d)),
    };
    const wp = jest.fn(({ page = 1 }: any) =>
      Promise.resolve([...(wpPages[page] ?? [])]),
    );
    // Non-paginated feed: same list on every page, oldest post on day 15.
    const bsky = jest.fn(() =>
      Promise.resolve([post("b19", 19), post("b15", 15)]),
    );

    await render(
      <Feed
        fetchers={[
          { fetcher: wp, props: {} },
          { fetcher: bsky, props: {} },
        ]}
      />,
    );
    const list = () => ({ props: lastListProps });

    // Page 1: cutoff at day 15 hides wp14, wp12, wp11.
    await waitFor(() =>
      expect(ids(list().props.data)).toEqual([
        "wp20",
        "b19",
        "wp18",
        "wp16",
        "b15",
      ]),
    );

    await act(async () => {
      await list().props.onEndReached();
    });

    // Load-more releases the held-back posts and keeps all of WP page 2.
    expect(ids(list().props.data)).toEqual([
      "wp20",
      "b19",
      "wp18",
      "wp16",
      "b15",
      "wp14",
      "wp12",
      "wp11",
      "wp10",
      "wp8",
      "wp6",
      "wp4",
      "wp2",
    ]);
    expect(wp).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });
});
