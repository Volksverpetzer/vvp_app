type UnknownRecord = Record<string, unknown>;

export const isObjectRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

export const hasStringProperty = <TKey extends string>(
  value: unknown,
  key: TKey,
): value is Record<TKey, string> =>
  isObjectRecord(value) && typeof value[key] === "string";

export const hasUri = (value: unknown): value is { uri: string } =>
  hasStringProperty(value, "uri");

export const hasCreatedAt = (value: unknown): value is { created_at: string } =>
  hasStringProperty(value, "created_at");

export const hasText = (value: unknown): value is { text: string } =>
  hasStringProperty(value, "text");
