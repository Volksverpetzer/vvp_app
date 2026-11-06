import {
  INTRO_PAGE_TITLE,
  findPageIndexForAnchor,
  findPageIndexForPageNumber,
  normalizeFacets,
  parseArticlePageLink,
  splitArticlePages,
  stripVisualComposerShortcodes,
} from "#/helpers/utils/posts";

describe("normalizeFacets", () => {
  test("returns falsy values unchanged", () => {
    expect(normalizeFacets(null)).toBeNull();
    expect(normalizeFacets(undefined)).toBeUndefined();
  });

  test("returns undefined for non-array input", () => {
    expect(normalizeFacets({ some: "value" })).toBeUndefined();
  });

  test("maps facet py_type to $type and removes py_type", () => {
    const input = [{ py_type: "facetType", other: 1 }];
    const out = normalizeFacets(input) as unknown as Record<string, unknown>[];
    expect(Array.isArray(out)).toBeTruthy();
    expect(out[0]["$type"]).toBe("facetType");
    expect(out[0]["py_type"]).toBeUndefined();
    // original input must not be mutated
    expect(input[0].py_type).toBe("facetType");
  });

  test("normalizes index: py_type -> $type and byte_start/byte_end -> byteStart/byteEnd", () => {
    const input = [
      {
        py_type: "facetType",
        index: {
          py_type: "indexType",
          byte_start: 2,
          byte_end: 5,
        },
      },
    ];
    const out = normalizeFacets(input) as unknown as Record<string, unknown>[];
    const idx = out[0]["index"] as Record<string, unknown>;
    expect(idx["$type"]).toBe("indexType");
    expect(idx["byteStart"]).toBe(2);
    expect(idx["byteEnd"]).toBe(5);
    expect(idx["py_type"]).toBeUndefined();
    expect(idx["byte_start"]).toBeUndefined();
    expect(idx["byte_end"]).toBeUndefined();
    // original index remains unchanged
    expect(input[0].index.py_type).toBe("indexType");
    expect(input[0].index.byte_start).toBe(2);
  });

  test("normalizes features and nested feature index", () => {
    const input = [
      {
        py_type: "facetType",
        features: [
          {
            py_type: "featType",
            index: {
              py_type: "featureIndex",
              byte_start: 10,
              byte_end: 15,
            },
          },
        ],
      },
    ];

    const out = normalizeFacets(input) as unknown as Record<string, unknown>[];
    const feat = (out[0]["features"] as Record<string, unknown>[])[0];
    expect(feat["$type"]).toBe("featType");
    expect(feat["py_type"]).toBeUndefined();

    const featureIndex = feat["index"] as Record<string, unknown>;
    expect(featureIndex["$type"]).toBe("featureIndex");
    expect(featureIndex["byteStart"]).toBe(10);
    expect(featureIndex["byteEnd"]).toBe(15);
    expect(featureIndex["py_type"]).toBeUndefined();
    expect(featureIndex["byte_start"]).toBeUndefined();
    expect(featureIndex["byte_end"]).toBeUndefined();

    // original feature/index should still have original keys
    expect(input[0].features[0].py_type).toBe("featType");
    expect(input[0].features[0].index.byte_start).toBe(10);
  });

  test("returns empty array for empty array input", () => {
    expect(normalizeFacets([])).toEqual([]);
  });

  test("facet without py_type has no $type key", () => {
    const input = [{ other: "value" }];
    const out = normalizeFacets(input) as unknown as Record<string, unknown>[];
    expect(out[0]).not.toHaveProperty("$type");
    expect(out[0]["other"]).toBe("value");
  });

  test("facet without index has no index key in output", () => {
    const input = [{ py_type: "t", other: 42 }];
    const out = normalizeFacets(input) as unknown as Record<string, unknown>[];
    expect(out[0]).not.toHaveProperty("index");
    expect(out[0]["$type"]).toBe("t");
    expect(out[0]["other"]).toBe(42);
  });

  test("does not overwrite existing byteStart/byteEnd", () => {
    const input = [
      {
        index: {
          byte_start: 1,
          byteStart: 99,
          byte_end: 2,
          byteEnd: 100,
        },
      },
    ];
    const out = normalizeFacets(input) as unknown as Record<string, unknown>[];
    const idx = out[0]["index"] as Record<string, unknown>;
    // existing byteStart/byteEnd kept, byte_start/byte_end removed
    expect(idx["byteStart"]).toBe(99);
    expect(idx["byteEnd"]).toBe(100);
    expect(idx["byte_start"]).toBeUndefined();
    expect(idx["byte_end"]).toBeUndefined();
  });
});

describe("stripVisualComposerShortcodes", () => {
  test("removes Visual Composer opening, closing, and nested shortcodes while preserving content", () => {
    const input = `
      <p>Intro paragraph.</p>
      [vc_row]
        [vc_column width="1/2"]
          <p>Left column text.</p>
          [vc_custom_heading text="Headline"]
        [/vc_column]
        [vc_column width="1/2"]
          <p>Right column text.</p>
        [/vc_column]
      [/vc_row]
      <p>Outro paragraph.</p>
    `;

    const output = stripVisualComposerShortcodes(input);

    expect(output).toContain("<p>Intro paragraph.</p>");
    expect(output).toContain("<p>Left column text.</p>");
    expect(output).toContain("<p>Right column text.</p>");
    expect(output).toContain("<p>Outro paragraph.</p>");
    expect(output).not.toMatch(/\[\/?vc_[\s\S]*?]/i);
  });

  test("handles shortcode tags split across lines", () => {
    const input = `[vc_column
      width="1/1"
      el_class="hero"
    ]Body[/vc_column]`;

    expect(stripVisualComposerShortcodes(input)).toBe("Body");
  });

  test("returns empty string unchanged", () => {
    expect(stripVisualComposerShortcodes("")).toBe("");
  });

  test("removes uppercase VC_ shortcodes (case-insensitive)", () => {
    expect(stripVisualComposerShortcodes("[VC_ROW]Body[/VC_ROW]")).toBe("Body");
  });

  test("returns content without Visual Composer shortcodes unchanged", () => {
    const input = "<p>Plain article content only.</p>";

    expect(stripVisualComposerShortcodes(input)).toBe(input);
  });

  test("does not remove non-Visual-Composer shortcodes", () => {
    const input = `
      <p>Intro</p>
      [gallery ids="1,2,3"]
      [video src="https://example.com/video.mp4"][/video]
      [vc_row][vc_column]Body[/vc_column][/vc_row]
    `;

    const output = stripVisualComposerShortcodes(input);

    expect(output).toContain('[gallery ids="1,2,3"]');
    expect(output).toContain(
      '[video src="https://example.com/video.mp4"][/video]',
    );
    expect(output).toContain("Body");
    expect(output).not.toMatch(/\[\/?vc_[\s\S]*?]/i);
  });
});

describe("splitArticlePages", () => {
  test("returns content without markers unchanged as a single page", () => {
    const input = '<p>Plain article.</p><h2 id="a">A</h2>';
    expect(splitArticlePages(input)).toEqual([
      { title: INTRO_PAGE_TITLE, html: input, pageNumber: 1 },
    ]);
  });

  test("splits at paragraph markers and removes them without empty paragraphs", () => {
    const input =
      '<p>Intro.</p>\n<p>[nextpage title="Phase 1"]</p>\n<h2>One</h2>\n' +
      '<p>[nextpage title="Phase 2"]</p>\n<p>Two.</p>';
    const pages = splitArticlePages(input);
    expect(pages.map((page) => page.title)).toEqual([
      INTRO_PAGE_TITLE,
      "Phase 1",
      "Phase 2",
    ]);
    expect(pages.map((page) => page.pageNumber)).toEqual([1, 2, 3]);
    expect(pages[0].html).toBe("<p>Intro.</p>\n");
    expect(pages[1].html).toBe("\n<h2>One</h2>\n");
    expect(pages[2].html).toBe("\n<p>Two.</p>");
    for (const page of pages) {
      expect(page.html).not.toContain("[nextpage");
      expect(page.html).not.toMatch(/<p[^>]*>\s*<\/p>/);
    }
  });

  test("handles a marker after a <br> at the end of a paragraph", () => {
    const input =
      '<p>Last sentence.<br>[nextpage title="1980-2012"]</p>\n<p>Next.</p>';
    const pages = splitArticlePages(input);
    expect(pages[0].html).toBe("<p>Last sentence.</p>");
    expect(pages[1]).toEqual({
      title: "1980-2012",
      html: "\n<p>Next.</p>",
      pageNumber: 2,
    });
  });

  test("keeps the paragraph when a marker starts it", () => {
    const pages = splitArticlePages(
      '<p>Intro.</p><p class="x">[nextpage title="B"]Text of B.</p>',
    );
    expect(pages[0].html).toBe("<p>Intro.</p>");
    expect(pages[1].html).toBe('<p class="x">Text of B.</p>');
  });

  test("drops an empty intro but keeps the website page numbers", () => {
    const pages = splitArticlePages(
      '\n<p>[nextpage title="A"]</p><p>A.</p><p>[nextpage title="B"]</p><p>B.</p>',
    );
    expect(pages.map((page) => [page.title, page.pageNumber])).toEqual([
      ["A", 2],
      ["B", 3],
    ]);
  });

  test("decodes titles and accepts typographic quotes", () => {
    const pages = splitArticlePages(
      "<p>Intro</p><p>[nextpage title=&#8221;Müller &amp; Co&#8221;]</p><p>x</p>",
    );
    expect(pages[1].title).toBe("Müller & Co");
  });

  test("falls back to a numbered title when the marker has none", () => {
    const pages = splitArticlePages("<p>Intro</p><p>[nextpage]</p><p>x</p>");
    expect(pages[1].title).toBe("Seite 2");
  });
});

describe("findPageIndexForAnchor", () => {
  const pages = splitArticlePages(
    '<h2 id="intro">I</h2><p>[nextpage title="A"]</p><h2 id="quellen">Q</h2>' +
      '<p>[nextpage title="B"]</p><h3 id="a&amp;b">AB</h3>',
  );

  test("finds the page containing the id", () => {
    expect(findPageIndexForAnchor(pages, "intro")).toBe(0);
    expect(findPageIndexForAnchor(pages, "quellen")).toBe(1);
  });

  test("matches ids written with HTML entities", () => {
    expect(findPageIndexForAnchor(pages, "a&b")).toBe(2);
  });

  test("returns -1 for unknown or empty ids", () => {
    expect(findPageIndexForAnchor(pages, "missing")).toBe(-1);
    expect(findPageIndexForAnchor(pages, "")).toBe(-1);
  });
});

describe("findPageIndexForPageNumber", () => {
  test("maps website page numbers to page indexes", () => {
    const pages = splitArticlePages(
      '<p>[nextpage title="A"]</p><p>A</p><p>[nextpage title="B"]</p><p>B</p>',
    );
    expect(findPageIndexForPageNumber(pages, 3)).toBe(1);
    expect(findPageIndexForPageNumber(pages, 1)).toBe(-1);
    expect(findPageIndexForPageNumber(pages, 9)).toBe(-1);
  });
});

describe("parseArticlePageLink", () => {
  const link = "https://volksverpetzer.de/aktuelles/chronologie/";

  test("reads the page number of the article's paged URLs", () => {
    expect(parseArticlePageLink(`${link}3/`, link)).toEqual({ pageNumber: 3 });
    expect(parseArticlePageLink(`${link}12`, link)).toEqual({
      pageNumber: 12,
    });
  });

  test("returns the fragment of a paged URL", () => {
    expect(parseArticlePageLink(`${link}3/#quellen%20`, link)).toEqual({
      pageNumber: 3,
      anchor: "quellen%20",
    });
  });

  test("ignores other URLs", () => {
    expect(parseArticlePageLink(link, link)).toBeUndefined();
    expect(parseArticlePageLink(`${link}#x`, link)).toBeUndefined();
    expect(parseArticlePageLink(`${link}0/`, link)).toBeUndefined();
    expect(parseArticlePageLink(`${link}amp/`, link)).toBeUndefined();
    expect(
      parseArticlePageLink("https://volksverpetzer.de/aktuelles/x/2/", link),
    ).toBeUndefined();
  });
});
