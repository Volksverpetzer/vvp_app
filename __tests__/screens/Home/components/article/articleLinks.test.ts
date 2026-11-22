import { describe, expect, it } from "@jest/globals";

import { classifyArticleLink } from "#/screens/Home/components/article/articleLinks";

const ARTICLE = "https://www.volksverpetzer.de/analyse/some-article/";

describe("classifyArticleLink", () => {
  it("passes https links through", () => {
    expect(classifyArticleLink("https://example.org/source", ARTICLE)).toEqual({
      kind: "web",
      href: "https://example.org/source",
    });
  });

  it("upgrades http links to https instead of ignoring them", () => {
    expect(classifyArticleLink("http://example.org/source", ARTICLE)).toEqual({
      kind: "web",
      href: "https://example.org/source",
    });
  });

  it("hands mailto: and tel: links to the OS", () => {
    expect(
      classifyArticleLink("mailto:redaktion@example.org", ARTICLE),
    ).toEqual({ kind: "system", href: "mailto:redaktion@example.org" });
    expect(classifyArticleLink("tel:+49301234567", ARTICLE)).toEqual({
      kind: "system",
      href: "tel:+49301234567",
    });
  });

  it("ignores other schemes and empty hrefs", () => {
    expect(classifyArticleLink("javascript:void(0)", ARTICLE)).toBeNull();
    expect(classifyArticleLink("about:///blank", ARTICLE)).toBeNull();
    expect(classifyArticleLink("", ARTICLE)).toBeNull();
  });

  it("treats bare #anchor links as anchors (decoded)", () => {
    expect(classifyArticleLink("about:///blank#Fazit%20", ARTICLE)).toEqual({
      kind: "anchor",
      id: "Fazit ",
    });
  });

  it("matches the current article regardless of www, scheme and trailing slash", () => {
    for (const href of [
      "https://volksverpetzer.de/analyse/some-article#quellen",
      "http://www.volksverpetzer.de/analyse/some-article/#quellen",
      "https://WWW.volksverpetzer.de/analyse/some-article/?utm=x#quellen",
    ]) {
      expect(classifyArticleLink(href, ARTICLE)).toEqual({
        kind: "anchor",
        id: "quellen",
      });
    }
  });

  it("does nothing for a link to the current article without anchor", () => {
    expect(
      classifyArticleLink(
        "https://volksverpetzer.de/analyse/some-article/",
        ARTICLE,
      ),
    ).toEqual({ kind: "none" });
  });

  it("does not treat a different article or host as the current one", () => {
    expect(
      classifyArticleLink(
        "https://www.volksverpetzer.de/analyse/some-article-2/",
        ARTICLE,
      ),
    ).toEqual({
      kind: "web",
      href: "https://www.volksverpetzer.de/analyse/some-article-2/",
    });
    expect(
      classifyArticleLink("https://example.org/analyse/some-article/", ARTICLE),
    ).toEqual({
      kind: "web",
      href: "https://example.org/analyse/some-article/",
    });
  });
});
