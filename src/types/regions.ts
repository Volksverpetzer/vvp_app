export type Region = {
  region: string;
  name: string;
  pageviews?: number;
};

export type RegionsByCode = Record<string, Region>;
