import type { HttpsUrl } from "#/types/config";
import type { InstaPostProperties } from "#/types/posts";

export const FAV_TYPE_ARTICLE = "article";
export const FAV_TYPE_INSTA = "insta";

export type FaveableType = typeof FAV_TYPE_ARTICLE | typeof FAV_TYPE_INSTA;

export type ShareableType = {
  url: HttpsUrl;
  title: string;
};

export type StoredFav = {
  contentType: FaveableType;
  // Full source URL of the saved content. Needed so favorites from a
  // secondary WordPress feed (e.g. Prüfpunkt) can be reloaded from the correct
  // site instead of the primary one, which would 404 and purge the favorite.
  originalUrl?: HttpsUrl;
  // Snapshot of an Instagram post, captured when it is favorited. The by-id
  // proxy (/proxy/instaById) only serves the default account, so a post from a
  // secondary account (e.g. Prüfpunkt) can't be re-fetched; this lets MyFavs
  // rebuild it directly. Also survives the cold-start ContentStore.clear().
  payload?: InstaPostProperties;
};

export type StoredFavs = Record<string, StoredFav>;

export type StoredSource = {
  slug: string;
  text?: string;
  date?: string;
};

export type StoredSources = Record<HttpsUrl, StoredSource>;
