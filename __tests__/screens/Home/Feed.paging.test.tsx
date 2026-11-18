import { describe, expect, it, jest } from "@jest/globals";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

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

const list = () => lastListProps;

// Paginated feed: 3 posts per page, newest first, pages 1..4.
const pagedFetcher = () =>
  jest.fn(({ page = 1 }: any) =>
    Promise.resolve(
      page > 4
        ? []
        : [0, 1, 2].map((i) => post(`p${page}-${i}`, 28 - page * 3 - i)),
    ),
  );

describe("Feed paging", () => {
  it("starts again from page 1 when the fetchers change (settings toggled)", async () => {
    const wp = pagedFetcher();
    const view = await render(<Feed fetchers={[{ fetcher: wp }]} />);
    await waitFor(() => expect(list().data).toHaveLength(3));

    await act(async () => {
      await list().onEndReached();
    });
    await act(async () => {
      await list().onEndReached();
    });
    expect(wp).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }));

    // A content setting changed: home.tsx builds a new fetchers array.
    await view.rerender(<Feed fetchers={[{ fetcher: wp }]} />);
    await waitFor(() =>
      expect(ids(list().data)).toEqual(["p1-0", "p1-1", "p1-2"]),
    );

    await act(async () => {
      await list().onEndReached();
    });
    // Without the reset this asked for page 4 and skipped pages 2-3.
    expect(wp).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it("ignores a second onEndReached while a load-more is in flight", async () => {
    const wp = pagedFetcher();
    await render(<Feed fetchers={[{ fetcher: wp }]} />);
    await waitFor(() => expect(list().data).toHaveLength(3));
    wp.mockClear();

    await act(async () => {
      const onEndReached = list().onEndReached;
      await Promise.all([onEndReached(), onEndReached()]);
    });

    expect(wp).toHaveBeenCalledTimes(1);
  });

  it("does not show the end-of-feed prompt when a load-more is superseded by a refresh", async () => {
    let releasePage2!: (value: any[]) => void;
    const wp = jest.fn(({ page = 1 }: any) =>
      page === 2
        ? new Promise<any[]>((resolve) => {
            releasePage2 = resolve;
          })
        : Promise.resolve([0, 1, 2].map((i) => post(`p1-${i}`, 20 - i))),
    );
    await render(<Feed fetchers={[{ fetcher: wp }]} />);
    await waitFor(() => expect(list().data).toHaveLength(3));

    let loadMore!: Promise<unknown>;
    await act(() => {
      loadMore = list().onEndReached();
    });
    await act(() => {
      list().refreshControl.props.onRefresh();
    });
    await act(async () => {
      releasePage2([]);
      await loadMore;
    });

    await waitFor(() => expect(list().data).toHaveLength(3));
    expect(screen.queryByText(/Nicht gefunden/)).toBeNull();
  });

  it("keeps the load-more guard when a superseded load-more settles late", async () => {
    const releases: ((value: any[]) => void)[] = [];
    const wp = jest.fn(({ page = 1 }: any) =>
      page === 2
        ? new Promise<any[]>((resolve) => {
            releases.push(resolve);
          })
        : Promise.resolve([0, 1, 2].map((i) => post(`p1-${i}`, 20 - i))),
    );
    await render(<Feed fetchers={[{ fetcher: wp }]} />);
    await waitFor(() => expect(list().data).toHaveLength(3));

    // Load-more A, superseded by a refresh; its fetcher ignores the abort.
    let staleLoadMore!: Promise<unknown>;
    await act(() => {
      staleLoadMore = list().onEndReached();
    });
    await act(() => {
      list().refreshControl.props.onRefresh();
    });
    await waitFor(() =>
      expect(list().refreshControl.props.refreshing).toBe(false),
    );

    // Load-more B starts; keep a handler from before B re-rendered, as a
    // second onEndReached arriving before the state update would use.
    const onEndReached = list().onEndReached;
    await act(() => {
      void onEndReached();
    });
    // A settles late: it must not clear B's guard.
    await act(async () => {
      releases[0]([]);
      await staleLoadMore;
    });
    await act(() => {
      void onEndReached();
    });

    const page2Calls = wp.mock.calls.filter(([props]: any) => props.page === 2);
    expect(page2Calls).toHaveLength(2);
  });

  it("offers a retry instead of the end-of-feed prompt when a load-more fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    let offline = false;
    const wp = jest.fn(({ page = 1 }: any) =>
      offline
        ? Promise.reject(new Error("offline"))
        : Promise.resolve([0, 1, 2].map((i) => post(`p${page}-${i}`, 20 - i))),
    );
    await render(<Feed fetchers={[{ fetcher: wp, name: "wp" }]} />);
    await waitFor(() => expect(list().data).toHaveLength(3));

    offline = true;
    await act(async () => {
      await list().onEndReached();
    });
    expect(screen.queryByText(/Nicht gefunden/)).toBeNull();
    expect(screen.queryByText(/nicht geladen werden/)).not.toBeNull();
    // Reaching the end again must not retry on its own: the footer swap
    // re-fires onEndReached, which looped spinner ↔ retry text.
    expect(list().onEndReached).toBeUndefined();

    // Back online: tapping the retry asks for the same page again.
    offline = false;
    fireEvent.press(screen.getByText(/nicht geladen werden/));
    await waitFor(() => expect(list().data).toHaveLength(6));
    expect(wp).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(list().data).toHaveLength(6);
    expect(screen.queryByText(/nicht geladen werden/)).toBeNull();
  });

  it("shows the end-of-feed prompt once a load-more brings nothing new", async () => {
    const wp = jest.fn(({ page = 1 }: any) =>
      Promise.resolve(
        page === 1 ? [0, 1, 2].map((i) => post(`p1-${i}`, 20 - i)) : [],
      ),
    );
    await render(<Feed fetchers={[{ fetcher: wp }]} />);
    await waitFor(() => expect(list().data).toHaveLength(3));

    await act(async () => {
      await list().onEndReached();
    });
    expect(screen.queryByText(/Nicht gefunden/)).not.toBeNull();
  });
});
