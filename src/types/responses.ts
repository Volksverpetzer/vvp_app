import type { HttpsUrl } from "#/types/config";

export interface ImageCredit {
  source: string;
  sourceUrl?: string;
  licence?: string;
}

export interface MediaResponse {
  source_url?: string;
  media_details?: {
    sizes?: {
      medium_large?: { source_url: string };
      medium?: { source_url: string };
      thumbnail?: { source_url: string };
    };
  };
  meta?: {
    isc_image_source?: string;
    isc_image_source_url?: string;
    isc_image_licence?: string;
    isc_image_source_own?: boolean;
  };
}

export interface AISearchResponse {
  url: HttpsUrl;
  text: string;
  title?: string;
}
