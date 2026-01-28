export const FAV_TYPE_ARTICLE = "article";
export const FAV_TYPE_INSTA = "insta";

export type FaveableType = typeof FAV_TYPE_ARTICLE | typeof FAV_TYPE_INSTA;

export type StoredFav = {
  contentType: FaveableType;
};

export type StoredFavs = Record<string, StoredFav>;

export type StoredReport = {
  id: string;
};

export type StoredReports = StoredReport[];

export type StoredSource = {
  slug: string;
  text?: string;
  date?: string;
};

export type StoredSources = Record<`https://${string}`, StoredSource>;
