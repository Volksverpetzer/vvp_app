import * as Linking from "expo-linking";

import Config from "#/constants/Config";
import { normalizeHost } from "#/helpers/utils/host";

/**
 * Plausible sites the app is allowed to report to / query, derived from the
 * configured WordPress feeds plus the primary site. Mirrors the backend
 * `SITES` allow-list so the `?site=` parameter is always one the proxy
 * accepts. Hosts are normalized (lower-cased, without `www.`), e.g.
 * "volksverpetzer.de" or "pruefpunkt.org".
 */
const knownSites = (): string[] =>
  Array.from(
    new Set(
      [Config.wpUrl, ...(Config.feeds?.wp ?? []).map((entry) => entry.handle)]
        .filter(Boolean)
        .map((url) => normalizeHost(Linking.parse(url!).hostname)),
    ),
  );

const defaultSite = (): string =>
  normalizeHost(Linking.parse(Config.wpUrl).hostname);

/**
 * Resolves the analytics site (Plausible domain / backend `site` param) for a
 * resource permalink. Falls back to the primary site when the permalink is
 * missing or not a configured feed site, so events for non-feed URLs (shop,
 * donations, search) stay attributed to the primary site as before.
 */
export const resolveAnalyticsSite = (permalink?: string): string => {
  if (!permalink) return defaultSite();
  const host = normalizeHost(Linking.parse(permalink).hostname);
  return knownSites().includes(host) ? host : defaultSite();
};
