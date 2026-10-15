import { describe, expect, it } from "@jest/globals";

import type { AnnouncementEntry } from "#/constants/Announcements";
import { announcementTitle } from "#/helpers/network/Analytics";

const entry = (message: string): AnnouncementEntry => ({
  id: "test",
  message,
  actionLabel: "Los",
  route: "/settings",
});

describe("announcementTitle", () => {
  it("uses the first line with the markdown stripped", () => {
    expect(
      announcementTitle(
        entry("**Wir sind nominiert!**\nHilf uns mit deiner Stimme"),
      ),
    ).toBe("Wir sind nominiert!");
  });

  it("keeps link and italic text but drops their syntax", () => {
    expect(
      announcementTitle(entry("*Neu*: mehr auf [Prüfpunkt](https://x.org)")),
    ).toBe("Neu: mehr auf Prüfpunkt");
  });

  it("truncates long lines with an ellipsis", () => {
    const title = announcementTitle(entry("a".repeat(200)));
    expect(title).toHaveLength(80);
    expect(title.endsWith("…")).toBe(true);
  });
});
