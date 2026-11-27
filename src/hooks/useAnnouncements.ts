import * as Application from "expo-application";
import { useCallback, useEffect, useState } from "react";

import PersonalStore from "#/helpers/Stores/PersonalStore";
import {
  fetchAnnouncements,
  parseAnnouncements,
} from "#/helpers/network/AnnouncementsAPI";
import { isAnnouncementActive } from "#/helpers/utils/announcements";
import { isAbortError } from "#/helpers/utils/networking";
import type { AnnouncementEntry } from "#/types";

/**
 * One-time in-feed announcement cards, shown at the top of the home feed until
 * dismissed. Only the first not-yet-dismissed, currently active entry is shown
 * at a time, in list order.
 *
 * The list is not part of the app: it is a JSON file on the Bunny CDN
 * (`Config.announcementsUrl`, one file per variant), so cards can be added or
 * removed without a release. The last fetched list is cached, so the card
 * appears immediately on later launches and works offline; a failed fetch
 * keeps the cached list.
 */
export const useAnnouncements = (enabled: boolean) => {
  const [announcements, setAnnouncements] = useState<AnnouncementEntry[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // Set once the network list arrives, so a slower cache read can't
    // overwrite it with the older cached copy.
    let fetched = false;
    const controller = new AbortController();

    fetchAnnouncements(controller.signal)
      .then((list) => {
        if (cancelled || !list) return;
        fetched = true;
        setAnnouncements(list);
        void PersonalStore.setCachedAnnouncements(list);
      })
      .catch((error) => {
        if (!isAbortError(error)) {
          console.warn("Could not load announcements:", error);
        }
      });

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
      if (!fetched && cached) {
        // Re-validate: the cache may predate a stricter schema.
        setAnnouncements(parseAnnouncements({ announcements: cached }) ?? []);
      }
      setLoaded(true);
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled]);

  // Gate on loaded so an already-dismissed announcement never flashes on
  // first render before the stored dismissal state has been read.
  const activeAnnouncement =
    enabled && loaded
      ? announcements.find(
          (announcement) =>
            !dismissed.includes(announcement.id) &&
            isAnnouncementActive(
              announcement,
              new Date(),
              Application.nativeApplicationVersion,
            ),
        )
      : undefined;

  const dismissAnnouncement = useCallback((id: string) => {
    setDismissed((previous) =>
      previous.includes(id) ? previous : [...previous, id],
    );
    void PersonalStore.dismissAnnouncement(id);
  }, []);

  return { activeAnnouncement, dismissAnnouncement };
};
