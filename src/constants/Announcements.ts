import type { Href } from "expo-router";

import { isMimikama, isVolksverpetzer } from "#/helpers/utils/variant";

export interface AnnouncementEntry {
  /** Stable id — used as the permanent-dismissal key, never reuse across entries. */
  id: string;
  /**
   * Card body. Supports inline markdown: `**bold**`, `*italic*`, and
   * `[text](https://…)` links. No block elements or nesting — see
   * parseInlineMarkdown.
   */
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
 *
 * Entries are per app variant (they tend to promote a variant's own feeds
 * or reference its own release) — each variant only sees its own list,
 * picked below. A variant with no entries yet gets an empty list.
 */
const volksverpetzerAnnouncements: AnnouncementEntry[] = [
  {
    id: "podcast-pruefpunkt-2026-08",
    message:
      "**Neu**: Der Volksverpetzer-Podcast ist jetzt in deinem Feed – und unsere Wissenschafts-Plattform Prüfpunkt ist ebenfalls mit dabei!\nWas du in deinem Feed siehst, kannst du selbst bestimmen:",
    actionLabel: "Feed-Einstellungen",
    route: "/settings",
  },
];

const mimikamaAnnouncements: AnnouncementEntry[] = [
  {
    id: "under-the-hood-2026-09",
    message:
      "**Neu**: Unter der Haube hat sich in dieser Version so manches getan – und auch die Oberfläche haben wir aufgeräumt. Fällt dir etwas auf, das nicht rund läuft oder aussieht? Sag uns gerne Bescheid:",
    actionLabel: "Feedback geben",
    route: {
      pathname: "/(tabs)/contact",
      params: { category: "app_feedback" },
    },
  },
];

const Announcements: AnnouncementEntry[] = isVolksverpetzer
  ? volksverpetzerAnnouncements
  : isMimikama
    ? mimikamaAnnouncements
    : [];

export default Announcements;
