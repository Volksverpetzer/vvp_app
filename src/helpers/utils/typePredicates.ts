import {
  FAV_TYPE_ARTICLE,
  FAV_TYPE_INSTA,
  type StoredFav,
  type StoredFavs,
  type StoredSource,
  type StoredSources,
} from "#/types";

export const isObjectRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const hasStringProperty = <TKey extends string>(
  value: unknown,
  key: TKey,
): value is Record<string, unknown> & Record<TKey, string> =>
  isObjectRecord(value) && typeof value[key] === "string";

export const hasUri = (value: unknown) => hasStringProperty(value, "uri");

export const hasCreatedAt = (value: unknown) =>
  hasStringProperty(value, "created_at");

export const hasText = (value: unknown) => hasStringProperty(value, "text");

export const isValidStoredFav = (v: unknown): v is StoredFav =>
  isObjectRecord(v) &&
  (v.contentType === FAV_TYPE_ARTICLE || v.contentType === FAV_TYPE_INSTA);

export const isValidStoredSource = (v: unknown): v is StoredSource =>
  isObjectRecord(v) && typeof v.slug === "string";

export const isValidFavorites = (v: unknown): v is StoredFavs =>
  isObjectRecord(v) && Object.values(v).every(isValidStoredFav);

export const isValidSources = (v: unknown): v is StoredSources =>
  isObjectRecord(v) &&
  Object.keys(v).every((k) => k.startsWith("https://")) &&
  Object.values(v).every(isValidStoredSource);
