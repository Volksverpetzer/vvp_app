import Statistics from "#/helpers/Statistics";
import ContentStore from "#/helpers/Stores/ContentStore";

/**
 * Tracks whether this app process has already handled its launch.
 *
 * Linking.getInitialURL() keeps returning the cold-start URL for the whole
 * process, and the index route remounts whenever something navigates to "/".
 * The launch is claimed by whichever comes first:
 * - `+native-intent`'s redirectSystemPath, when it routes the initial URL to a
 *   screen other than "/" (article, upload, share). The root stack is anchored
 *   on (tabs), so Index does not mount on such a cold start; its first mount
 *   comes later, when something navigates to "/".
 * - otherwise the first Index mount.
 * Without this, a later Index mount would re-evaluate the stale launch URL
 * (spinner stuck on an article URL, upload reopened) and re-run the app-open
 * routine.
 */
let launchHandled = false;

/**
 * Returns true exactly once per app process: for the first caller, which
 * should handle the launch URL and run the app-open routine.
 */
export const claimAppLaunch = (): boolean => {
  if (launchHandled) return false;
  launchHandled = true;
  return true;
};

/** Once-per-launch work: count the app open and drop cached feed content. */
export const appOpenRoutine = (): void => {
  // Notification registration is not refreshed here: _layout's
  // checkAndRequestOnLaunch does it once onboarding is done.
  void Statistics.countAppOpened();
  void ContentStore.clear();
};

/** Test-only: simulate a fresh app process. */
export const resetAppLaunchForTests = (): void => {
  launchHandled = false;
};
