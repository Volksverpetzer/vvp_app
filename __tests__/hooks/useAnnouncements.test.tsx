import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AppState } from "react-native";

import PersonalStore from "#/helpers/Stores/PersonalStore";
import { fetchAnnouncements } from "#/helpers/network/AnnouncementsAPI";
import { useAnnouncements } from "#/hooks/useAnnouncements";
import type { AnnouncementEntry } from "#/types";

jest.mock("#/helpers/network/AnnouncementsAPI", () => ({
  ...jest.requireActual<object>("#/helpers/network/AnnouncementsAPI"),
  fetchAnnouncements: jest.fn(),
}));
jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    getDismissedAnnouncements: jest.fn(),
    dismissAnnouncement: jest.fn(),
    getCachedAnnouncements: jest.fn(),
    setCachedAnnouncements: jest.fn(),
  },
}));

const mockFetch = fetchAnnouncements as jest.MockedFunction<
  typeof fetchAnnouncements
>;
const mockGetDismissed = PersonalStore.getDismissedAnnouncements as jest.Mock<
  typeof PersonalStore.getDismissedAnnouncements
>;
const mockGetCached = PersonalStore.getCachedAnnouncements as jest.Mock<
  typeof PersonalStore.getCachedAnnouncements
>;
const mockSetCached = PersonalStore.setCachedAnnouncements as jest.Mock<
  typeof PersonalStore.setCachedAnnouncements
>;

const card = (id: string, extra: Partial<AnnouncementEntry> = {}) =>
  ({
    id,
    message: id,
    actionLabel: "Los",
    route: "/settings",
    ...extra,
  }) as AnnouncementEntry;

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

describe("useAnnouncements", () => {
  let appStateListener: ((state: string) => void) | undefined;
  const removeListener = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDismissed.mockResolvedValue([]);
    mockGetCached.mockResolvedValue(undefined);
    mockSetCached.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue([card("remote")]);
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, listener) => {
        appStateListener = listener as (state: string) => void;
        return { remove: removeListener } as never;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does nothing when disabled", async () => {
    const { result } = await renderHook(() => useAnnouncements(false));
    expect(result.current.activeAnnouncement).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("keeps the fetched list when the cache read finishes later", async () => {
    const cacheRead = deferred<AnnouncementEntry[] | undefined>();
    mockGetCached.mockReturnValue(cacheRead.promise);
    const { result } = await renderHook(() => useAnnouncements(true));

    await act(() => {
      cacheRead.resolve([card("cached")]);
    });

    await waitFor(() =>
      expect(result.current.activeAnnouncement?.id).toBe("remote"),
    );
  });

  it("does not overwrite the cache when the fetch gives no usable list", async () => {
    mockFetch.mockResolvedValue(undefined);
    mockGetCached.mockResolvedValue([card("cached")]);
    const { result } = await renderHook(() => useAnnouncements(true));

    await waitFor(() =>
      expect(result.current.activeAnnouncement?.id).toBe("cached"),
    );
    expect(mockSetCached).not.toHaveBeenCalled();
  });

  it("aborts the fetch and stops listening on unmount", async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { unmount } = await renderHook(() => useAnnouncements(true));
    const signal = mockFetch.mock.calls[0][0]!;

    await unmount();

    expect(signal.aborted).toBe(true);
    expect(removeListener).toHaveBeenCalled();
  });

  it("refetches when the app returns to the foreground", async () => {
    const { result } = await renderHook(() => useAnnouncements(true));
    await waitFor(() =>
      expect(result.current.activeAnnouncement?.id).toBe("remote"),
    );

    mockFetch.mockResolvedValue([]);
    await act(() => appStateListener?.("background"));
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await act(() => appStateListener?.("active"));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(result.current.activeAnnouncement).toBeUndefined(),
    );
  });

  it("re-checks the time window when the app returns to the foreground", async () => {
    const now = jest.spyOn(Date.prototype, "getTime");
    mockFetch.mockReturnValue(new Promise(() => {}));
    mockGetCached.mockResolvedValue([
      card("ending", { endsAt: "2026-12-01T12:00:00Z" }),
    ]);
    now.mockReturnValue(Date.parse("2026-12-01T11:00:00Z"));
    const { result } = await renderHook(() => useAnnouncements(true));
    await waitFor(() =>
      expect(result.current.activeAnnouncement?.id).toBe("ending"),
    );

    now.mockReturnValue(Date.parse("2026-12-01T13:00:00Z"));
    await act(() => appStateListener?.("active"));

    expect(result.current.activeAnnouncement).toBeUndefined();
  });

  it("refetches on refresh()", async () => {
    const { result } = await renderHook(() => useAnnouncements(true));
    await waitFor(() => expect(result.current.activeAnnouncement).toBeTruthy());

    await act(() => result.current.refresh());

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  describe("canInsert", () => {
    it("withholds a card that arrives once insertion is no longer allowed", async () => {
      const fetch = deferred<AnnouncementEntry[] | undefined>();
      mockFetch.mockReturnValue(fetch.promise);
      const { result, rerender } = await renderHook(
        ({ canInsert }: { canInsert: boolean }) =>
          useAnnouncements(true, { canInsert }),
        { initialProps: { canInsert: true } },
      );
      await rerender({ canInsert: false });

      await act(() => fetch.resolve([card("late")]));

      expect(result.current.activeAnnouncement).toBeUndefined();
      // It still gets cached, and shows once insertion is allowed again.
      expect(mockSetCached).toHaveBeenCalledWith([card("late")]);
      await rerender({ canInsert: true });
      expect(result.current.activeAnnouncement?.id).toBe("late");
    });

    it("keeps a shown card and lets the next one replace it on dismissal", async () => {
      mockFetch.mockResolvedValue([card("first"), card("second")]);
      const { result, rerender } = await renderHook(
        ({ canInsert }: { canInsert: boolean }) =>
          useAnnouncements(true, { canInsert }),
        { initialProps: { canInsert: true } },
      );
      await waitFor(() =>
        expect(result.current.activeAnnouncement?.id).toBe("first"),
      );
      await rerender({ canInsert: false });
      expect(result.current.activeAnnouncement?.id).toBe("first");

      await act(() => result.current.dismissAnnouncement("first"));

      expect(result.current.activeAnnouncement?.id).toBe("second");
    });
  });
});
