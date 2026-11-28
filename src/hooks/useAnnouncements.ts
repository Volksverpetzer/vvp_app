import * as Application from "expo-application";
import Constants from "expo-constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import PersonalStore from "#/helpers/Stores/PersonalStore";
import {
  fetchAnnouncements,
  parseAnnouncements,
} from "#/helpers/network/AnnouncementsAPI";
import { isAnnouncementActive } from "#/helpers/utils/announcements";
import { isAbortError } from "#/helpers/utils/networking";
import type { AnnouncementEntry } from "#/types";

// In Expo Go the native version is Expo Go's own, which would hide every
// minAppVersion card during development; the manifest has the app's version.
const appVersion = __DEV__
  ? (Constants.expoConfig?.version ?? Application.nativeApplicationVersion)
  : Application.nativeApplicationVersion;

interface UseAnnouncementsOptions {
  /**
   * Whether a card may appear where none is shown right now. The feed passes
   * false once its posts are on screen, so a slow fetch can't push the list
   * down while someone is reading; a withheld card shows up on the next
   * pull-to-refresh or launch (from the cache). Replacing or removing a
   * shown card is always allowed.
   */
  canInsert?: boolean;
}

/**
 * One-time in-feed announcement cards, shown at the top of the home feed until
 * dismissed. Only the first not-yet-dismissed, currently active entry is shown
 * at a time, in list order.
 *
 * The list is not part of the app: it is a JSON file on the Bunny CDN
 * (`Config.announcementsUrl`, one file per variant), so cards can be added or
 * removed without a release. It is fetched on mount, whenever the app returns
 * to the foreground, and on `refresh()` (pull-to-refresh). The last fetched
 * list is cached, so the card appears immediately on later launches and works
 * offline; a failed fetch keeps the cached list.
 */
export const useAnnouncements = (
  enabled: boolean,
  { canInsert = true }: UseAnnouncementsOptions = {},
) => {
  const [announcements, setAnnouncements] = useState<AnnouncementEntry[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Bumped on foreground so startsAt/endsAt are re-checked against the clock.
  const [, setClockTick] = useState(0);
  // Set once a network list arrived, so a slower cache read can't overwrite
  // it with the older cached copy.
  const fetchedRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const shownRef = useRef(false);

  const load = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    fetchAnnouncements(controller.signal)
      .then((list) => {
        if (controller.signal.aborted || !list) return;
        fetchedRef.current = true;
        setAnnouncements(list);
        void PersonalStore.setCachedAnnouncements(list);
      })
      .catch((error) => {
        if (!isAbortError(error)) {
          console.warn("Could not load announcements:", error);
        }
      });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchedRef.current = false;
    load();

    Promise.all([
      PersonalStore.getDismissedAnnouncements(),
      PersonalStore.getCachedAnnouncements(),
    ]).then(([storedDismissed, cached]) => {
      if (cancelled) return;
      // Merge instead of replace: a dismissal made while this load was in
      // flight must not be reverted by the (stale) stored value.
      setDismissed((previous) => [
        ...new Set([...previous, ...storedDismissed]),
      ]);
      if (!fetchedRef.current && cached) {
        // Re-validate: the cache may predate a stricter schema.
        setAnnouncements(parseAnnouncements({ announcements: cached }) ?? []);
      }
      setLoaded(true);
    });

    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      setClockTick((tick) => tick + 1);
      load();
    });

    return () => {
      cancelled = true;
      subscription.remove();
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [enabled, load]);

  const candidate =
    enabled && loaded
      ? announcements.find(
          (announcement) =>
            !dismissed.includes(announcement.id) &&
            isAnnouncementActive(announcement, new Date(), appVersion),
        )
      : undefined;
  // Gate on loaded (above) so an already-dismissed announcement never flashes
  // before the stored dismissal state has been read.
  const activeAnnouncement =
    candidate && (shownRef.current || canInsert) ? candidate : undefined;

  useEffect(() => {
    shownRef.current = activeAnnouncement !== undefined;
  });

  const dismissAnnouncement = useCallback((id: string) => {
    setDismissed((previous) =>
      previous.includes(id) ? previous : [...previous, id],
    );
    void PersonalStore.dismissAnnouncement(id);
  }, []);

  const refresh = useCallback(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { activeAnnouncement, dismissAnnouncement, refresh };
};
