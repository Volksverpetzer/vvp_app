import type { HttpsUrl } from "#/types/config";
import type {
  InstaPostProperties,
  PodcastEpisodeProperties,
} from "#/types/posts";

export const FAV_TYPE_ARTICLE = "article";
export const FAV_TYPE_INSTA = "insta";
export const FAV_TYPE_PODCAST = "podcast";

export type FaveableType =
  typeof FAV_TYPE_ARTICLE | typeof FAV_TYPE_INSTA | typeof FAV_TYPE_PODCAST;

// Snapshot stored with a favorite for content that can't be re-fetched by id
// (Instagram posts across accounts, podcast episodes that age out of the feed).
export type FavPayload = InstaPostProperties | PodcastEpisodeProperties;

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
  // Snapshot of an Instagram post or podcast episode, captured when it is
  // saved. The by-id proxy (/proxy/instaById) only serves the default account,
  // and Podigee has no by-id endpoint, so these can't reliably be re-fetched;
  // this lets MyFavs rebuild them directly. Also survives the cold-start
  // ContentStore.clear().
  payload?: FavPayload;
};

export type StoredFavs = Record<string, StoredFav>;

export type StoredSource = {
  slug: string;
  text?: string;
  date?: string;
};

export type StoredSources = Record<HttpsUrl, StoredSource>;
