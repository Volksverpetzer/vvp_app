import { describe, expect, it } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";

import { useAudioAvailability } from "#/hooks/useAudioAvailability";

describe("useAudioAvailability", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = fetchMock;
  });

  it("is unavailable without checking when no URL is given", async () => {
    const { result } = await renderHook(() => useAudioAvailability(undefined));
    expect(result.current).toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("becomes available on a 200 response", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const { result } = await renderHook(() =>
      useAudioAvailability("https://cdn.example.com/audio/foo.mp3"),
    );
    await waitFor(() => expect(result.current).toBe("available"));
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cdn.example.com/audio/foo.mp3",
      expect.objectContaining({ method: "HEAD" }),
    );
  });

  it("becomes unavailable on a 404 response", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    const { result } = await renderHook(() =>
      useAudioAvailability("https://cdn.example.com/audio/missing.mp3"),
    );
    await waitFor(() => expect(result.current).toBe("unavailable"));
  });

  it("fails open to available when the request itself errors", async () => {
    fetchMock.mockRejectedValue(new Error("network error"));
    const { result } = await renderHook(() =>
      useAudioAvailability("https://cdn.example.com/audio/foo.mp3"),
    );
    await waitFor(() => expect(result.current).toBe("available"));
  });

  it("resets to checking when the URL changes", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const { result, rerender } = await renderHook(
      ({ url }: { url: string | undefined }) => useAudioAvailability(url),
      { initialProps: { url: "https://cdn.example.com/audio/foo.mp3" } },
    );
    await waitFor(() => expect(result.current).toBe("available"));

    let resolveSecond!: (value: { ok: boolean }) => void;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSecond = resolve;
      }),
    );
    await rerender({ url: "https://cdn.example.com/audio/bar.mp3" });
    expect(result.current).toBe("checking");

    resolveSecond({ ok: true });
    await waitFor(() => expect(result.current).toBe("available"));
  });
});
