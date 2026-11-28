import type { AnnouncementEntry } from "#/types";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
// Full date-time with an explicit offset. Anything looser (no offset, a space
// instead of "T", German "31.10.2026") is parsed differently — or not at all —
// depending on the JS engine, so it is rejected rather than guessed at.
const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Parses an announcement `startsAt`/`endsAt` value to epoch milliseconds, or
 * NaN if it is not in a supported format:
 * - an ISO 8601 date-time with offset ("2026-10-01T00:00:00+02:00"), or
 * - a date ("2026-10-31"), taken in the device's local time zone: the start of
 *   that day for `startsAt`, the end of that day for `endsAt`.
 */
export const parseAnnouncementDate = (
  value: string,
  edge: "start" | "end",
): number => {
  const dateOnly = DATE_ONLY_PATTERN.exec(value);
  if (dateOnly) {
    const [year, month, day] = dateOnly.slice(1).map(Number);
    const date = new Date(year, month - 1, day);
    // Reject dates that roll over, e.g. 2026-02-31.
    if (date.getMonth() !== month - 1 || date.getDate() !== day) return NaN;
    return edge === "start"
      ? date.getTime()
      : new Date(year, month - 1, day + 1).getTime() - 1;
  }
  return DATE_TIME_PATTERN.test(value) ? Date.parse(value) : NaN;
};

/** Whether a value is a supported `startsAt`/`endsAt` date. */
export const isAnnouncementDate = (value: unknown): value is string =>
  typeof value === "string" &&
  Number.isFinite(parseAnnouncementDate(value, "start"));

/**
 * Compares dotted numeric versions ("4.10.0" > "4.9.2"); missing parts count
 * as 0. Returns a negative number, 0, or a positive number.
 */
export const compareVersions = (a: string, b: string): number => {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] || 0) - (right[index] || 0);
    if (difference !== 0) return difference;
  }
  return 0;
};

/**
 * Whether an announcement should be shown right now on this app version.
 * An unknown app version (e.g. on web) does not block `minAppVersion` cards.
 */
export const isAnnouncementActive = (
  announcement: AnnouncementEntry,
  now: Date,
  appVersion: string | null | undefined,
): boolean => {
  const time = now.getTime();
  if (
    announcement.startsAt &&
    !(time >= parseAnnouncementDate(announcement.startsAt, "start"))
  ) {
    return false;
  }
  if (
    announcement.endsAt &&
    !(time <= parseAnnouncementDate(announcement.endsAt, "end"))
  ) {
    return false;
  }
  if (
    announcement.minAppVersion &&
    appVersion &&
    compareVersions(appVersion, announcement.minAppVersion) < 0
  ) {
    return false;
  }
  return true;
};
