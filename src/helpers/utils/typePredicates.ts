export const isObjectRecord = (value: unknown) =>
  typeof value === "object" && value !== null;

export const hasStringProperty = <TKey extends string>(
  value: unknown,
  key: TKey,
): value is Record<TKey, string> =>
  isObjectRecord(value) &&
  typeof (value as Record<string, unknown>)[key] === "string";

export const hasUri = (value: unknown) => hasStringProperty(value, "uri");

export const hasCreatedAt = (value: unknown) =>
  hasStringProperty(value, "created_at");

export const hasText = (value: unknown) => hasStringProperty(value, "text");
