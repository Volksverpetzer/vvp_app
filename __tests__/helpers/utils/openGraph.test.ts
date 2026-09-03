import { describe, expect, it, jest } from "@jest/globals";

import { fetchOpenGraphPreview } from "#/helpers/utils/openGraph";

const mockGet = jest.fn() as jest.MockedFunction<
  (...args: unknown[]) => Promise<string>
>;
jest.mock("#/helpers/utils/networking", () => ({
  get: (...args: unknown[]) => mockGet(...args),
}));

jest.mock("#/helpers/network/WordPressAPI", () => ({
  __esModule: true,
  default: { client: {} },
}));

const PAGE_URL = "https://www.volksverpetzer.de/project/foo/" as const;

describe("fetchOpenGraphPreview", () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  it("extracts title, description and image regardless of attribute order", async () => {
    mockGet.mockResolvedValue(`
      <html><head>
        <meta property="og:title" content="Sachsen-Anhalt: Landtagswahl 2026" />
        <meta content="Warum sich Wählen lohnt." property="og:description" />
        <meta property="og:image" content="https://example.com/preview.jpg" />
      </head></html>
    `);

    const preview = await fetchOpenGraphPreview(PAGE_URL);

    expect(preview).toEqual({
      title: "Sachsen-Anhalt: Landtagswahl 2026",
      description: "Warum sich Wählen lohnt.",
      image: "https://example.com/preview.jpg",
    });
  });

  it("decodes HTML entities in the extracted values", async () => {
    mockGet.mockResolvedValue(
      `<meta property="og:title" content="Fakten &amp; Fiktion &quot;Test&quot;" />`,
    );

    const preview = await fetchOpenGraphPreview(PAGE_URL);

    expect(preview?.title).toBe('Fakten & Fiktion "Test"');
  });

  it("returns null when there's no og:title, even if other tags are present", async () => {
    mockGet.mockResolvedValue(
      `<meta property="og:description" content="No title here" />`,
    );

    expect(await fetchOpenGraphPreview(PAGE_URL)).toBeNull();
  });

  it("omits description/image when only og:title is present", async () => {
    mockGet.mockResolvedValue(
      `<meta property="og:title" content="Just a title" />`,
    );

    expect(await fetchOpenGraphPreview(PAGE_URL)).toEqual({
      title: "Just a title",
      description: undefined,
      image: undefined,
    });
  });

  it("returns null instead of throwing when the fetch fails", async () => {
    mockGet.mockRejectedValue(new Error("network error"));

    await expect(fetchOpenGraphPreview(PAGE_URL)).resolves.toBeNull();
  });

  it("passes the url and abort signal through to the fetch layer", async () => {
    mockGet.mockResolvedValue(`<meta property="og:title" content="Title" />`);
    const controller = new AbortController();

    await fetchOpenGraphPreview(PAGE_URL, controller.signal);

    expect(mockGet).toHaveBeenCalledWith(
      expect.anything(),
      PAGE_URL,
      expect.objectContaining({
        responseType: "text",
        signal: controller.signal,
      }),
    );
  });
});
