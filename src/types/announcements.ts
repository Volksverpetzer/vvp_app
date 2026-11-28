import type { Href } from "expo-router";

/**
 * An in-feed announcement card. The list is fetched at runtime from the
 * variant's `announcementsUrl` (a JSON file on the Bunny CDN), so cards can be
 * added or removed without an app release — see useAnnouncements.
 */
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
  /** In-app route, or an external `https://` URL (opened via onLinkPress). */
  route: Href;
  /** Only show on app versions >= this (e.g. "4.3.0"), for cards about new features. */
  minAppVersion?: string;
  /** ISO 8601 date/time from which the card is shown. */
  startsAt?: string;
  /** ISO 8601 date/time after which the card is no longer shown. */
  endsAt?: string;
}
