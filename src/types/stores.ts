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
};

export type StoredFavs = Record<string, StoredFav>;

export type StoredSource = {
  slug: string;
  text?: string;
  date?: string;
};

export type StoredSources = Record<HttpsUrl, StoredSource>;
