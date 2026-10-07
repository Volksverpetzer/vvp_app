import Config from "#/constants/Config";
import BaseStore from "#/helpers/Storage";
import { isHttpsUrl } from "#/helpers/utils/networking";
import type { HttpsUrl } from "#/types";

const STORAGE_KEY = "apiUrlOverride";

// In-memory copy of the user's override so request code can resolve the
// base URL synchronously. Loaded once at startup by SettingsProvider, which
// holds back rendering until then.
let override: HttpsUrl | undefined;

/**
 * Normalizes user input to a bare https origin/path without trailing slash,
 * or returns undefined if it isn't a valid https URL.
 */
export const normalizeApiUrl = (input: string): HttpsUrl | undefined => {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!isHttpsUrl(trimmed)) return undefined;
  try {
    new URL(trimmed);
  } catch {
    return undefined;
  }
  return trimmed;
};

/**
 * Base URL of the app server: the user's override (FOSS builds can point
 * the app at a self-hosted server) or the variant's configured default.
 */
export const getApiUrl = (): HttpsUrl => override ?? Config.apiUrl;

export const getApiUrlOverride = (): HttpsUrl | undefined => override;

export const loadApiUrlOverride = async (): Promise<void> => {
  const stored = await BaseStore.getItem(STORAGE_KEY);
  override = stored ? normalizeApiUrl(stored) : undefined;
};

/**
 * Persists a new override; pass undefined (or the default URL) to reset to
 * the configured server.
 */
export const setApiUrlOverride = async (
  url: HttpsUrl | undefined,
): Promise<void> => {
  if (!url || url === Config.apiUrl) {
    override = undefined;
    await BaseStore.removeItem(STORAGE_KEY);
    return;
  }
  override = url;
  await BaseStore.setItem(STORAGE_KEY, url);
};
