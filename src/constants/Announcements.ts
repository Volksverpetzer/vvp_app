import type { Href } from "expo-router";

export interface AnnouncementEntry {
  /** Stable id — used as the permanent-dismissal key, never reuse across entries. */
  id: string;
  message: string;
  actionLabel: string;
  route: Href;
}

/**
 * One-time in-feed announcement cards for existing users, shown at the top of
 * the home feed until dismissed (see PersonalStore.dismissAnnouncement). Only
 * the first not-yet-dismissed entry is shown at a time (oldest first — nothing
 * is silently skipped).
 *
 * To promote something new next release: append a new entry. If an older
 * entry is no longer worth showing (e.g. it's now common knowledge), delete
 * it here rather than letting it linger — there's no automatic expiry.
 */
const Announcements: AnnouncementEntry[] = [
  {
    id: "pruefpunkt-feed-2026-07",
    message:
      "Wusstest du schon? Wir haben jetzt auch Prüfpunkt in unserer App! Falls du das nicht sehen möchtest, kannst du es in den Einstellungen abschalten.",
    actionLabel: "Zu den Einstellungen",
    route: "/settings",
  },
];

export default Announcements;
