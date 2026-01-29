import { HttpsUrl } from "#/types/config";

export interface MediaResponse {
  media_details?: {
    sizes?: {
      medium_large?: { source_url: string };
      medium?: { source_url: string };
      thumbnail?: { source_url: string };
    };
  };
}

export interface AISearchResponse {
  url: HttpsUrl;
  text: string;
  title?: string;
}

export interface StatusResponse {
  id: string;
  status: "posted" | "pending";
  url?: string;
}
