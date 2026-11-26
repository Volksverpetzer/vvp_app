import { useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { registerEvent } from "#/helpers/network/Analytics";

/**
 * Routes that never send a "Screen View":
 * - Articles already send a Plausible "pageview" for their own path, so
 *   counting them here would count twice.
 *   `[category]` alone is the article loader too (it re-exports
 *   `[category]/[slug]` for flat permalinks), not a category screen.
 * - The entry route and the redirect-only routes are never seen by the user.
 */
const SKIPPED_ROUTES = new Set([
  "",
  "[category]",
  "[category]/[slug]",
  "index",
  "handle-share",
  "external-link",
  "+native-intent",
]);

/** Routes whose name can't be derived from their static segments. */
const ROUTE_SCREEN_NAMES: Record<string, string> = {
  "+not-found": "not-found",
};

const isGroup = (segment: string) => /^\(.*\)$/.test(segment);
const isDynamic = (segment: string) => segment.startsWith("[");

/**
 * Plausible screen name for the current Expo Router route, or null when the
 * route isn't tracked. Built from the route pattern, never the URL, so no
 * slugs, IDs or search terms end up in analytics: `(tabs)/personal` →
 * "personal", `game/[gameId]` → "game", `bsky/[post_id]` → "bsky", `insta/[post_id]` → "insta".
 */
export const screenNameFromSegments = (segments: string[]): string | null => {
  const routeSegments = segments.filter((segment) => !isGroup(segment));
  const route = routeSegments.join("/");
  if (SKIPPED_ROUTES.has(route)) return null;
  if (route in ROUTE_SCREEN_NAMES) return ROUTE_SCREEN_NAMES[route];
  const name = routeSegments.filter((segment) => !isDynamic(segment)).join("-");
  return name || null;
};

/**
 * Matches Plausible's own session timeout: after this long in the background
 * the user is in a new Plausible session, so screens count again.
 */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const seenScreens = new Set<string>();

/** Forgets which screens were counted, starting a new app session. */
export const resetScreenViewSession = () => seenScreens.clear();

const trackScreen = (screen: string | null) => {
  if (!screen || seenScreens.has(screen)) return;
  seenScreens.add(screen);
  registerEvent("", "Screen View", { screen });
};

/**
 * Sends a Plausible "Screen View" event (prop `screen`) when the user reaches
 * a screen. Mounted once in the root layout, so new routes are covered
 * automatically.
 *
 * NOTE: Each screen is counted at most ONCE PER APP SESSION, not on every
 * visit. Plausible bills custom events like pageviews and tab switches are
 * frequent, so counting every navigation would eat into the plan's quota.
 * The numbers therefore read as "sessions that used this screen", not raw
 * visit counts. A session ends on a cold start or after SESSION_TIMEOUT_MS
 * in the background.
 *
 * Opt-out and beta builds are handled by registerEvent (Config.enableAnalytics).
 */
export const useScreenViewTracking = () => {
  const segments = useSegments() as string[];
  const screen = screenNameFromSegments(segments);
  const currentScreen = useRef(screen);
  currentScreen.current = screen;

  useEffect(() => {
    trackScreen(screen);
  }, [screen]);

  useEffect(() => {
    let backgroundedAt: number | null = null;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background") {
        backgroundedAt = Date.now();
      } else if (nextState === "active" && backgroundedAt !== null) {
        const timedOut = Date.now() - backgroundedAt >= SESSION_TIMEOUT_MS;
        backgroundedAt = null;
        if (timedOut) {
          resetScreenViewSession();
          // The user is back on a screen in a new session: count it.
          trackScreen(currentScreen.current);
        }
      }
    });
    return () => subscription.remove();
  }, []);
};
