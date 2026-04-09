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
