import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import type { HttpsUrl } from "#/types";

export type FetchHeaders = Record<string, string>;

export type FetchRequestConfig = {
  method?: string;
  headers?: FetchHeaders;
  params?: Record<string, string | number | boolean | null | undefined>;
  data?: unknown;
  responseType?: "json" | "text";
  signal?: AbortSignal;
};

export type FetchResponse<T> = {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  url: string;
  ok: boolean;
};

export type FetchClient = {
  request: <T>(
    config: FetchRequestConfig & { url: string },
  ) => Promise<FetchResponse<T>>;
};

export class FetchError extends Error {
  status: number;
  statusText: string;
  url: string;
  body: unknown;

  constructor(
    message: string,
    info: { status: number; statusText: string; url: string; body: unknown },
  ) {
    super(message);
    this.name = "FetchError";
    this.status = info.status;
    this.statusText = info.statusText;
    this.url = info.url;
    this.body = info.body;
  }
}

function buildUrl(
  baseURL: HttpsUrl,
  url: string,
  params?: FetchRequestConfig["params"],
): string {
  const finalUrl =
    url.startsWith("http://") || url.startsWith("https://")
      ? new URL(url)
      : new URL(url, baseURL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      finalUrl.searchParams.set(key, String(value));
    }
  }
  return finalUrl.toString();
}

/**
 * Create a fetch client with default headers.
 *
 * The User-Agent will look like this:
 * YourApp/1.2.3 (android; Android 14; Pixel 7)
 * YourApp/1.2.3 (ios; iOS 17.3; iPhone 15 Pro)
 *
 * @param baseURL Base URL for requests
 * @param extraHeaders Additional headers merged into every request
 */
export function createClient(
  baseURL: HttpsUrl,
  extraHeaders: FetchHeaders = {},
): FetchClient {
  const baseHeaders: FetchHeaders = {
    "Content-Type": "application/json",
    "User-Agent": `${Constants.expoConfig?.slug}/${Application?.nativeApplicationVersion} (${Platform.OS}; ${Device.osName} ${Device.osVersion}; ${Device.modelName})`,
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    ...extraHeaders,
  };

  return {
    request: async <T>({
      url,
      method = "GET",
      headers,
      params,
      data,
      responseType = "json",
      signal,
    }: FetchRequestConfig & { url: string }): Promise<FetchResponse<T>> => {
      const requestUrl = buildUrl(baseURL, url, params);
      const mergedHeaders: FetchHeaders = {
        ...baseHeaders,
        ...(headers ?? {}),
      };

      const init: RequestInit = { method, headers: mergedHeaders, signal };

      if (data !== undefined && method.toUpperCase() !== "GET") {
        if (
          typeof data === "string" ||
          data instanceof FormData ||
          data instanceof ArrayBuffer ||
          ArrayBuffer.isView(data)
        ) {
          init.body = data as BodyInit;
        } else {
          init.body = JSON.stringify(data);
        }
      }

      const response = await fetch(requestUrl, init);
      const rawText = await response.text();

      let parsed: unknown;
      if (responseType === "text") {
        parsed = rawText;
      } else if (rawText.length === 0) {
        parsed = null;
      } else {
        try {
          parsed = JSON.parse(rawText);
        } catch {
          parsed = rawText;
        }
      }

      if (!response.ok) {
        throw new FetchError(`Request failed with status ${response.status}`, {
          status: response.status,
          statusText: response.statusText,
          url: requestUrl,
          body: parsed,
        });
      }

      return {
        data: parsed as T,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: requestUrl,
        ok: true,
      };
    },
  };
}

/**
 * Fetch with timeout using AbortController.
 */
export async function fetchWithTimeout<T>(
  client: FetchClient,
  path: string,
  config: FetchRequestConfig = {},
  abortTime?: number,
): Promise<FetchResponse<T>> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), abortTime ?? 60_000);
  try {
    return await client.request<T>({
      url: path,
      ...config,
      signal: controller.signal,
    });
  } catch (error) {
    console.error(error);
    console.error(path);
    throw error;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Type guard for URLs that use the https scheme.
 */
export const isHttpsUrl = (url: string): url is HttpsUrl =>
  url.startsWith("https://");

/**
 * GET request wrapper. Accepts optional config and abortTime.
 */
export async function get<T>(
  client: FetchClient,
  path: string,
  config: FetchRequestConfig = {},
  abortTime?: number,
): Promise<T> {
  const response = await fetchWithTimeout<T>(
    client,
    path,
    { method: "GET", ...config },
    abortTime,
  );
  return response.data;
}

/**
 * POST request wrapper.
 */
export async function post<T, D>(
  client: FetchClient,
  path: string,
  data: D,
  abortTime?: number,
): Promise<T> {
  const response = await fetchWithTimeout<T>(
    client,
    path,
    { method: "POST", data },
    abortTime,
  );
  return response.data;
}
