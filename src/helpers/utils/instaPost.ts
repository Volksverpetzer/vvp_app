import Config from "#/constants/Config";
import API from "#/helpers/network/ServerAPI";
import { isAbortError } from "#/helpers/utils/networking";
import type { InstaPostProperties } from "#/types";

const PROXY_MEDIA_PATH = "/proxy/media_url";

/**
 * Whether the server can still serve this image link once Instagram's own
 * link inside it has expired. Only proxy links that carry their post_id can
 * be refreshed (vvp_app_server#41); older proxy links and raw Instagram CDN
 * links stop loading for good once expired. A missing link or an empty
 * post_id can't be refreshed either.
 */
const isRefreshableMediaUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.pathname === PROXY_MEDIA_PATH &&
      !!parsed.searchParams.get("post_id")
    );
  } catch {
    return false;
  }
};

/**
 * Whether a stored snapshot of an Instagram post (e.g. a favorite) has image
 * links that may have expired for good, so the post should be fetched again.
 */
export const hasStaleMediaUrls = (post: InstaPostProperties): boolean =>
  !isRefreshableMediaUrl(post.media_url) ||
  (post.children?.data ?? []).some(
    (child) => !isRefreshableMediaUrl(child.media_url),
  );

/**
 * Fetches an Instagram post by ID without knowing its account: the proxy only
 * reads posts of the account it is asked for, so each configured account is
 * tried in turn (the first one is the app's main account).
 * @throws the last account's error if none of them has the post.
 */
export const fetchInstaPostFromAnyAccount = async (
  id: string,
  signal?: AbortSignal,
): Promise<InstaPostProperties> => {
  const accounts = (Config.feeds.insta ?? [])
    .map((entry) => entry.handle)
    .filter(Boolean);
  if (accounts.length === 0) return API.getInstaPost(id, signal);

  let lastError: unknown;
  for (const account of accounts) {
    try {
      return await API.getInstaPost(id, signal, account);
    } catch (error) {
      if (isAbortError(error)) throw error;
      lastError = error;
    }
  }
  throw lastError;
};
