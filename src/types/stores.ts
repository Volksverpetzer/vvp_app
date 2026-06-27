import type { HttpsUrl } from "#/types/config";

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
};

export type StoredFavs = Record<string, StoredFav>;

export type StoredSource = {
  slug: string;
  text?: string;
  date?: string;
};

export type StoredSources = Record<HttpsUrl, StoredSource>;
