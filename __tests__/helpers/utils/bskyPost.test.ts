import { getBskyPostId, getBskyPostUrl } from "#/helpers/utils/bskyPost";

describe("bskyPost", () => {
  const atUri = "at://did:plc:test/app.bsky.feed.post/abc123";

  it("extracts the post ID from an AT-protocol URI", () => {
    expect(getBskyPostId(atUri)).toBe("abc123");
  });

  it("builds the bsky.app web URL of a post", () => {
    expect(getBskyPostUrl("tester.bsky.social", atUri)).toBe(
      "https://bsky.app/profile/tester.bsky.social/post/abc123",
    );
  });
});
