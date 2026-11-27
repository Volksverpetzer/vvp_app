import type { AnnouncementEntry } from "#/types";

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
  if (announcement.startsAt && time < Date.parse(announcement.startsAt)) {
    return false;
  }
  if (announcement.endsAt && time > Date.parse(announcement.endsAt)) {
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
