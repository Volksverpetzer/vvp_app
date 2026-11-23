/**
 * Tracks whether this app process has already handled its launch.
 *
 * Linking.getInitialURL() keeps returning the cold-start URL for the whole
 * process, and the index route remounts whenever something navigates to "/".
 * Without this flag every remount would re-evaluate the launch link (and could
 * reopen it) and re-run the app-open routine.
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

/** Test-only: simulate a fresh app process. */
export const resetAppLaunchForTests = (): void => {
  launchHandled = false;
};
