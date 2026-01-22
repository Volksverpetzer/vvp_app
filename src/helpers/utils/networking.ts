import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import * as Application from "expo-application";

/**
 * Create an Axios client with default headers.
 * @param baseURL Base URL for requests
 */
export function createClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "vvp-app-" + (Application?.nativeBuildVersion ?? "dev"),
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

/**
 * Fetch with timeout using AbortController.
 */
export async function fetchWithTimeout<T>(
  client: AxiosInstance,
  path: string,
  config: AxiosRequestConfig = {},
  abortTime?: number,
): Promise<AxiosResponse<T>> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), abortTime || 60_000);
  try {
    return await client.request<T>({
      url: path,
      ...config,
      signal: controller.signal,
    });
  } catch (error: any) {
    console.error(error);
    console.error(path);
    throw error;
  } finally {
    clearTimeout(id);
  }
}

/**
 * GET request wrapper. Accepts optional config and abortTime.
 */
export async function get<T>(
  client: AxiosInstance,
  path: string,
  config: AxiosRequestConfig = {},
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
  client: AxiosInstance,
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
