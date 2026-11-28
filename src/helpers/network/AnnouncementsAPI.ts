import type { Href } from "expo-router";

import Config from "#/constants/Config";
import { isAnnouncementDate } from "#/helpers/utils/announcements";
import { FetchError, createClient, get } from "#/helpers/utils/networking";
import type { AnnouncementEntry } from "#/types";

const ANNOUNCEMENTS_TIMEOUT_MS = 10_000;

const VERSION_PATTERN = /^\d+(\.\d+)*$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isInAppPath = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//");

/** An `https://` URL that actually parses and names a host. */
const isHttpsUrlWithHost = (value: string): boolean => {
  if (!value.startsWith("https://")) return false;
  try {
    return new URL(value).hostname.length > 0;
  } catch {
    return false;
  }
};

/**
 * Accepts an external `https://` URL, an in-app path ("/settings"), or a
 * `{ pathname, params }` object with string/number params. Anything else
 * (e.g. `javascript:` or protocol-relative URLs) is rejected.
 */
const parseRoute = (value: unknown): Href | undefined => {
  if (typeof value === "string") {
    return isHttpsUrlWithHost(value) || isInAppPath(value)
      ? (value as Href)
      : undefined;
  }
  if (!isPlainObject(value) || !isInAppPath(value.pathname)) return undefined;
  if (value.params === undefined) return { pathname: value.pathname } as Href;
  if (!isPlainObject(value.params)) return undefined;
  const params: Record<string, string> = {};
  for (const [key, param] of Object.entries(value.params)) {
    if (typeof param !== "string" && typeof param !== "number") {
      return undefined;
    }
    params[key] = String(param);
  }
  return { pathname: value.pathname, params } as Href;
};

/** Validates one entry; returns undefined for anything malformed. */
const parseEntry = (value: unknown): AnnouncementEntry | undefined => {
  if (!isPlainObject(value)) return undefined;
  const { id, message, actionLabel, minAppVersion, startsAt, endsAt } = value;
  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(message) ||
    !isNonEmptyString(actionLabel)
  ) {
    return undefined;
  }
  const route = parseRoute(value.route);
  if (!route) return undefined;
  const entry: AnnouncementEntry = { id, message, actionLabel, route };
  if (minAppVersion !== undefined) {
    if (
      typeof minAppVersion !== "string" ||
      !VERSION_PATTERN.test(minAppVersion)
    ) {
      return undefined;
    }
    entry.minAppVersion = minAppVersion;
  }
  if (startsAt !== undefined) {
    if (!isAnnouncementDate(startsAt)) return undefined;
    entry.startsAt = startsAt;
  }
  if (endsAt !== undefined) {
    if (!isAnnouncementDate(endsAt)) return undefined;
    entry.endsAt = endsAt;
  }
  return entry;
};

/**
 * Validates the announcements document (`{ "announcements": [...] }`).
 * Malformed entries and repeated ids are dropped individually, so one typo
 * doesn't take down the whole list. Returns undefined if the document itself
 * is not in the expected shape (e.g. a CDN error page) or none of its entries
 * are valid; `{ "announcements": [] }` is the way to publish "no cards".
 */
export const parseAnnouncements = (
  data: unknown,
): AnnouncementEntry[] | undefined => {
  if (!isPlainObject(data) || !Array.isArray(data.announcements)) {
    return undefined;
  }
  const seen = new Set<string>();
  const entries: AnnouncementEntry[] = [];
  for (const raw of data.announcements) {
    const entry = parseEntry(raw);
    if (!entry) {
      console.warn("Ignoring malformed announcement:", raw);
      continue;
    }
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    entries.push(entry);
  }
  // Every entry broken (e.g. a field renamed throughout) is an authoring
  // mistake, not "no cards": treat it like an unusable document so the cached
  // list survives instead of being wiped.
  if (entries.length === 0 && data.announcements.length > 0) return undefined;
  return entries;
};

/**
 * Fetches the announcement list for this app variant. Resolves to undefined
 * when no URL is configured, the file is missing (404) or the response is
 * unusable, so callers can keep their cached list; throws on network errors.
 */
export const fetchAnnouncements = async (
  signal?: AbortSignal,
): Promise<AnnouncementEntry[] | undefined> => {
  const url = Config.announcementsUrl;
  if (!url) return undefined;
  let data: unknown;
  try {
    data = await get<unknown>(
      createClient(url),
      url,
      { signal, silentStatuses: [404] },
      ANNOUNCEMENTS_TIMEOUT_MS,
    );
  } catch (error) {
    // Not uploaded (yet): same as an unusable document, and not worth a
    // warning on every mount, foreground and refresh.
    if (error instanceof FetchError && error.status === 404) return undefined;
    throw error;
  }
  return parseAnnouncements(data);
};
