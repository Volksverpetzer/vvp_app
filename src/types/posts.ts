import type { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import type { FC } from "react";

import type { HttpsUrl } from "./config";
import type { FaveableType, ShareableType } from "./stores";

export const DISPLAY_TEXT_FULL = "full";
export const DISPLAY_TEXT_EXCERPT = "excerpt";
export const DISPLAY_TEXT_NONE = "none";

export type DisplayText =
  | typeof DISPLAY_TEXT_FULL
  | typeof DISPLAY_TEXT_EXCERPT
  | typeof DISPLAY_TEXT_NONE;

export interface Post<T> {
  datetime: string;
  component: FC;
  id: string;
  shareable?: ShareableType[];
  contentFavIdentifier?: string;
  contentType?: FaveableType;
  priority?: number;
  inView: boolean;
  data: T;
}

export interface PostAuthor {
  display_name?: string; // The AT Proto SDK types use camelCase, but our Python backend returns snake_case.
  handle: string;
  avatar?: string;
}

export interface ArticleProperties {
  _links: {
    "wp:featuredmedia": { href: string }[];
  };
  date: string;
  link: HttpsUrl;
  description: string;
  categories: number[];
  id: number;
  slug: string;
  date_gmt: string;
  title: string;
  content?: { rendered: string };
  authors: { display_name: string; slug: string }[];
  imageUrl?: string;
}

export type LoadArticlePostProperties = Omit<ArticleProperties, "title"> & {
  title: { rendered: string };
  yoast_head_json?: { description?: string };
};

export interface InstaPostProperties {
  id: string;
  children?: {
    data: { media_url: string; id: string }[];
  };
  media_url: string;
  caption: string;
  displayText?: DisplayText;
  disableLink?: boolean;
  media_type: string;
  timestamp: string;
  permalink: HttpsUrl;
  inView?: boolean;
}

export interface BlueskyPostProperties {
  post: FeedViewPost;
  replies?: FeedViewPost[];
  inView?: boolean;
}

export interface ClaimReview {
  publisher: {
    name: string;
    site: string;
  };
  url: string;
  title: string;
  reviewDate: string;
  textualRating: string;
  languageCode: string;
}

export interface ClaimProperties {
  text: string;
  claimant: string;
  claimDate: string;
  claimReview: ClaimReview[];
  count: number;
  id: number;
}

export interface MastodonPostProperties {
  id: number;
  created_at: string;
  content: string;
  displayText?: DisplayText;
  replies_count: number;
  reblogs_count: number;
  favourites_count: number;
  answers: MastodonPostProperties[] | null;
  in_reply_to_id: number;
  reblog: unknown;
  card: null;
  uri: string;
  account: {
    id: number;
    username: string;
    uri: string;
    acct: string;
    display_name: string;
    followers_count: number;
    following_count: number;
    statuses_count: number;
    avatar: string;
  };
}

export interface TiktokPostProperties {
  embed_link: string;
  create_time?: number;
  title?: string;
  video_description?: string;
  cover_image_url: string;
  embed_html?: string;
  height: number;
  width: number;
  share_url?: string;
  id: string;
}

export interface YouTubePostProperties {
  id: string;
  player: {
    embedHtml: string;
    embedHeight: string;
    embedWidth: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      standard: {
        url: string;
        width: number;
        height: number;
      };
      high: {
        url: string;
        width: number;
        height: number;
      };
      default: {
        url: string;
        width: number;
        height: number;
      };
    };
  };
  inView?: boolean;
}
