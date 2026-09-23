import { describe, expect, it, jest } from "@jest/globals";
import { render, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";

import { spacing } from "#/constants/Spacing";
import RegionMap from "#/screens/ActionTab/components/RegionMap";

const mockGetRegions = jest.fn<() => Promise<string>>();
jest.mock("#/helpers/network/Action", () => ({
  getRegions: () => mockGetRegions(),
}));

const mockUseSafeAreaInsets = jest.fn(() => ({ bottom: 0 }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockUseSafeAreaInsets(),
}));

const flatten = (style: unknown): Record<string, unknown> => {
  const parts = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...parts.filter(Boolean));
};

// region,name,pageviews — five DE regions so both the top-3 ranking and the
// "rest" list render.
const csv = [
  "DE-BY,Bayern,500",
  "DE-BE,Berlin,400",
  "DE-HH,Hamburg,300",
  "DE-NW,Nordrhein-Westfalen,200",
  "DE-HE,Hessen,100",
].join("\n");

describe("RegionMap", () => {
  it("ranks the top 3 regions by pageviews, highest first", async () => {
    mockGetRegions.mockResolvedValue(csv);
    const { findByText } = await render(<RegionMap />);
    // Confirms both the sort (highest pageviews first) and the "1./2./3."
    // vs. "4./5." rendering split at the top-3 boundary.
    expect(await findByText(" Bayern")).toBeTruthy();
    expect(await findByText("4. Nordrhein-Westfalen")).toBeTruthy();
    expect(await findByText("5. Hessen")).toBeTruthy();
  });

  it("renders nothing extra when the feed returns no regions", async () => {
    mockGetRegions.mockResolvedValue("");
    const { queryByText } = await render(<RegionMap />);
    await waitFor(() => {
      expect(queryByText("Bundesländer Ranking")).toBeTruthy();
    });
    expect(queryByText(/^\d\./)).toBeNull();
  });

  // Regression guard: the top-3 rows used to carry their own margin: 3,
  // where two adjacent rows' margins summed to the real gap (3+3=6). That
  // was flipped to a single `gap` on the wrapping list — reusing the old
  // per-row value directly (spacing.xs) would have silently tightened the
  // on-screen spacing between rows and left the left inset overshooting the
  // original ~3px. See this PR.
  it("keeps the ranking list's gap and left inset at their fixed values", async () => {
    mockGetRegions.mockResolvedValue(csv);
    const { findByText, toJSON } = await render(<RegionMap />);
    await findByText(" Bayern");

    const findRankingList = (node: any): any => {
      if (!node) return undefined;
      const style = flatten(node.props?.style);
      if ("paddingLeft" in style && "gap" in style) return node;
      for (const child of node.children ?? []) {
        if (typeof child !== "object") continue;
        const found = findRankingList(child);
        if (found) return found;
      }
      return undefined;
    };

    const list = findRankingList(toJSON());
    expect(list).toBeDefined();
    const style = flatten(list.props.style);
    expect(style.gap).toBe(spacing.sm);
    expect(style.paddingLeft).toBe(spacing.xs);
  });

  // Regression guard: this clearance used to sit on just the ranking
  // column, so it was overridden by the map column's own height whenever
  // that column was taller — the card's actual bottom edge never reached
  // the tab bar clearance it was meant to keep clear of. It must live on
  // the outer row so it governs the whole card regardless of which column
  // is taller. See PR #589 (web-image-preflight-and-sizing follow-up).
  it("sizes the card's bottom margin from the shared tab-bar clearance", async () => {
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 83 });
    mockGetRegions.mockResolvedValue(csv);
    const { findByText, toJSON } = await render(<RegionMap />);
    await findByText(" Bayern");

    const root = toJSON() as any;
    expect(flatten(root.props.style).marginBottom).toBe(83 + spacing.xl);
  });

  // Regression guard: native bleeds this card to the device edge under its
  // real tab bar, so only the top corners are rounded there. Web has no
  // such chrome to blend into and now has a visible gap below the card
  // (previous test), so it should round all four corners instead of ending
  // on a flat edge. See this PR.
  it("rounds all four corners on web but only the top ones on native", async () => {
    mockGetRegions.mockResolvedValue(csv);

    const { findByText, toJSON } = await render(<RegionMap />);
    await findByText(" Bayern");
    const nativeStyle = flatten((toJSON() as any).props.style);
    expect(nativeStyle.borderBottomLeftRadius).toBeUndefined();
    expect(nativeStyle.borderBottomRightRadius).toBeUndefined();

    const platform = jest.replaceProperty(Platform, "OS", "web");
    try {
      const web = await render(<RegionMap />);
      await web.findByText(" Bayern");
      const webStyle = flatten((web.toJSON() as any).props.style);
      expect(webStyle.borderTopLeftRadius).toBe(
        webStyle.borderBottomLeftRadius,
      );
      expect(webStyle.borderTopRightRadius).toBe(
        webStyle.borderBottomRightRadius,
      );
      expect(webStyle.borderBottomLeftRadius).toBeGreaterThan(0);
    } finally {
      platform.restore();
    }
  });

  // Regression guard: Cache-Control isn't CORS-safelisted, so sending it on
  // web forces a preflight the map proxy doesn't answer and the image
  // silently never loads. See this PR.
  it("omits the Cache-Control source header on web but keeps it on native", async () => {
    mockGetRegions.mockResolvedValue(csv);

    const findExpoImageNode = (node: any): any => {
      if (!node) return undefined;
      if (node.type === "ViewManagerAdapter_ExpoImage") return node;
      for (const child of node.children ?? []) {
        if (typeof child !== "object") continue;
        const found = findExpoImageNode(child);
        if (found) return found;
      }
      return undefined;
    };

    const { findByText, toJSON } = await render(<RegionMap />);
    await findByText(" Bayern");
    expect(findExpoImageNode(toJSON()).props.source[0].headers).toEqual({
      "Cache-Control": "max-age=604800",
    });

    const platform = jest.replaceProperty(Platform, "OS", "web");
    try {
      const web = await render(<RegionMap />);
      await web.findByText(" Bayern");
      expect(
        findExpoImageNode(web.toJSON()).props.source[0].headers,
      ).toBeUndefined();
    } finally {
      platform.restore();
    }
  });
});
