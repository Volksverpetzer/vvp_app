import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import API from "#/helpers/network/ServerAPI";
import {
  fetchInstaPostFromAnyAccount,
  hasStaleMediaUrls,
} from "#/helpers/utils/instaPost";

const mockConfig: { feeds: { insta?: { handle: string }[] } } = {
  feeds: { insta: [{ handle: "volksverpetzer" }, { handle: "pruefpunkt" }] },
};
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  get default() {
    return mockConfig;
  },
}));
jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: { getInstaPost: jest.fn() },
}));

const getInstaPost = API.getInstaPost as jest.Mock<typeof API.getInstaPost>;

const proxy = (query: string) =>
  `https://volksverpetzer-app.de/proxy/media_url?hash=h&url=u${query}`;

const post = (media_url: string, children?: string[]) =>
  ({
    id: "1",
    media_url,
    media_type: children ? "CAROUSEL_ALBUM" : "IMAGE",
    caption: "",
    timestamp: "2026-01-01T00:00:00Z",
    permalink: "https://www.instagram.com/p/x/",
    children: children && {
      data: children.map((url, i) => ({ id: `c${i}`, media_url: url })),
    },
  }) as any;

describe("hasStaleMediaUrls", () => {
  it("accepts proxy links that carry their post_id", () => {
    expect(
      hasStaleMediaUrls(
        post(proxy("&post_id=1&account=a"), [
          proxy("&post_id=1&child_id=c0&account=a"),
        ]),
      ),
    ).toBe(false);
  });

  it("flags proxy links without post_id (saved before vvp_app_server#41)", () => {
    expect(hasStaleMediaUrls(post(proxy("&account=a")))).toBe(true);
  });

  it("flags a carousel when only one child link is stale", () => {
    expect(
      hasStaleMediaUrls(
        post(proxy("&post_id=1"), [proxy("&post_id=1"), proxy("")]),
      ),
    ).toBe(true);
  });

  it("flags raw Instagram CDN links and unparsable links", () => {
    expect(
      hasStaleMediaUrls(post("https://scontent.cdninstagram.com/a.jpg")),
    ).toBe(true);
    expect(hasStaleMediaUrls(post("not a url"))).toBe(true);
  });

  it("flags a missing link and an empty post_id", () => {
    expect(hasStaleMediaUrls(post(undefined as any))).toBe(true);
    expect(hasStaleMediaUrls(post(proxy("&post_id=")))).toBe(true);
    expect(hasStaleMediaUrls(post(proxy("&post_id")))).toBe(true);
  });
});

describe("fetchInstaPostFromAnyAccount", () => {
  beforeEach(() => {
    getInstaPost.mockReset();
    mockConfig.feeds.insta = [
      { handle: "volksverpetzer" },
      { handle: "pruefpunkt" },
    ];
  });

  it("tries each configured account until one has the post", async () => {
    const found = post(proxy("&post_id=1"));
    getInstaPost
      .mockRejectedValueOnce(new Error("502"))
      .mockResolvedValueOnce(found);

    await expect(fetchInstaPostFromAnyAccount("1")).resolves.toBe(found);
    expect(getInstaPost.mock.calls).toEqual([
      ["1", undefined, "volksverpetzer"],
      ["1", undefined, "pruefpunkt"],
    ]);
  });

  it("throws the last error when no account has the post", async () => {
    const last = new Error("last");
    getInstaPost
      .mockRejectedValueOnce(new Error("first"))
      .mockRejectedValueOnce(last);

    await expect(fetchInstaPostFromAnyAccount("1")).rejects.toBe(last);
  });

  it("stops at an abort instead of trying the next account", async () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    getInstaPost.mockRejectedValueOnce(abort);

    await expect(fetchInstaPostFromAnyAccount("1")).rejects.toBe(abort);
    expect(getInstaPost).toHaveBeenCalledTimes(1);
  });

  it("asks the proxy's default account when none is configured", async () => {
    mockConfig.feeds.insta = undefined;
    getInstaPost.mockResolvedValueOnce(post(proxy("&post_id=1")));

    await fetchInstaPostFromAnyAccount("1");
    expect(getInstaPost).toHaveBeenCalledWith("1", undefined);
  });
});
