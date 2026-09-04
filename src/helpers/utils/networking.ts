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
        ...headers,
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
  suppressErrorLog = false,
): Promise<FetchResponse<T>> {
  const controller = new AbortController();
  const externalSignal = config.signal;
  const onExternalAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, {
        once: true,
      });
    }
  }

  const id = setTimeout(() => controller.abort(), abortTime ?? 60_000);
  try {
    return await client.request<T>({
      url: path,
      ...config,
      signal: controller.signal,
    });
  } catch (error) {
    if (!controller.signal.aborted && !suppressErrorLog) {
      console.error(error);
      console.error(path);
    }
    throw error;
  } finally {
    clearTimeout(id);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}

/**
 * Type guard for URLs that use the https scheme.
 */
export const isHttpsUrl = (url: string): url is HttpsUrl =>
  url.startsWith("https://");

const GET_RETRY_ATTEMPTS = 2;
const GET_RETRY_DELAY_MS = 500;

/**
 * Resolves after `ms`, or immediately once `signal` aborts — so a caller
 * cancelling between retries (e.g. a screen unmounting) doesn't have to wait
 * out the rest of the backoff. Resolving (rather than rejecting) on abort is
 * deliberate: the next loop iteration's fetchWithTimeout call will see the
 * signal is already aborted and fail fast on its own.
 */
const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        resolve();
      },
      { once: true },
    );
  });

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

/**
 * Whether a failed GET is worth retrying: transient server errors (5xx) and
 * plain network failures (fetch throws a TypeError, e.g. offline/DNS/timeout
 * right at the socket level). Client errors (4xx) and deliberate aborts are
 * not retried since a retry wouldn't change the outcome.
 */
function isRetryableGetError(error: unknown): boolean {
  if (error instanceof FetchError) return error.status >= 500;
  return error instanceof TypeError;
}

/**
 * GET request wrapper. Accepts optional config and abortTime. Retries
 * transient failures a couple of times with a short delay — GET is safe to
 * retry since it has no side effects, unlike POST.
 *
 * fetchWithTimeout's own per-attempt error logging is suppressed here so a
 * transient failure that succeeds on retry doesn't spam the log; get() logs
 * exactly once, only for a genuine final failure.
 */
export async function get<T>(
  client: FetchClient,
  path: string,
  config: FetchRequestConfig = {},
  abortTime?: number,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetchWithTimeout<T>(
        client,
        path,
        { method: "GET", ...config },
        abortTime,
        true,
      );
      return response.data;
    } catch (error) {
      const willRetry =
        attempt < GET_RETRY_ATTEMPTS && isRetryableGetError(error);
      if (!willRetry) {
        if (!isAbortError(error)) {
          console.error(error);
          console.error(path);
        }
        throw error;
      }
      await delay(GET_RETRY_DELAY_MS * (attempt + 1), config.signal);
    }
  }
}

/**
 * POST request wrapper.
 */
export async function post<T, D>(
  client: FetchClient,
  path: string,
  data: D,
  abortTime?: number,
  config: FetchRequestConfig = {},
): Promise<T> {
  const response = await fetchWithTimeout<T>(
    client,
    path,
    { method: "POST", data, ...config },
    abortTime,
  );
  return response.data;
}
