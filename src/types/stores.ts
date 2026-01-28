export type FaveableType = "article" | "insta";

export type StoredF = {
  contentType: FaveableType;
};

export type StoredFavs = Record<string, StoredF>;

export type StoredReport = {
  id: string;
};

export type StoredSources = Record<
  `https://${string}`,
  {
    slug: string;
    text?: string;
    date?: string;
  }
>;
