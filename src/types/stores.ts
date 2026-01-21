export type FaveableType = "article" | "insta";
export type StoredFav = Record<string, { contentType: FaveableType }>;

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
