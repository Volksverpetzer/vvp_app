import { describe, expect, it, jest } from "@jest/globals";
import { render, waitFor } from "@testing-library/react-native";

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

  it("sizes the right column's bottom padding from the shared tab-bar clearance", async () => {
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 83 });
    mockGetRegions.mockResolvedValue(csv);
    const { findByText, toJSON } = await render(<RegionMap />);
    await findByText(" Bayern");

    const findColumn = (node: any): any => {
      if (!node) return undefined;
      const style = flatten(node.props?.style);
      if (style.paddingBottom === 83 + spacing.xl) return node;
      for (const child of node.children ?? []) {
        if (typeof child !== "object") continue;
        const found = findColumn(child);
        if (found) return found;
      }
      return undefined;
    };

    expect(findColumn(toJSON())).toBeDefined();
  });
});
