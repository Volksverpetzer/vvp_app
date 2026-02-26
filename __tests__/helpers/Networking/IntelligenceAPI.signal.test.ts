import { describe, expect, it, jest } from "@jest/globals";

import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import * as Networking from "#/helpers/utils/networking";

jest.mock("#/helpers/utils/networking", () => ({
  __esModule: true,
  createClient: jest.fn(() => ({
    defaults: {
      headers: {
        common: {},
      },
    },
  })),
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    aiUrl: "https://ai.example.com",
  },
}));

describe("IntelligenceAPI AbortSignal forwarding", () => {
  it("forwards signal to networking.post in vectorSearch", async () => {
    const postSpy = jest.spyOn(Networking, "post").mockResolvedValue({
      results: [],
    } as any);
    const controller = new AbortController();

    await IntelligenceAPI.vectorSearch("test", controller.signal);

    expect(postSpy).toHaveBeenCalledWith(
      expect.anything(),
      "/api/vector-search/",
      { query: "test", n_results: 20 },
      undefined,
      { signal: controller.signal },
    );
  });
});
