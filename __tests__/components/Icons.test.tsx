import { render } from "@testing-library/react-native";
import { Platform } from "react-native";

import * as Icons from "#/components/Icons";

const mockLucide = jest.fn((_props: { name: string; size?: number }) => null);

jest.mock("@react-native-vector-icons/lucide/static", () => ({
  __esModule: true,
  default: (props: { name: string; size?: number }) => mockLucide(props),
}));

const renderedNames = () => mockLucide.mock.calls.map(([props]) => props.name);

describe("Icons", () => {
  beforeEach(() => mockLucide.mockClear());

  it.each([
    ["ArticleViewIcon", "eye"],
    ["CheckboxIcon", "check"],
    ["ClockIcon", "clock"],
    ["CircleIcon", "circle"],
    ["CloseIcon", "x"],
    ["DeleteIcon", "trash-2"],
    ["DownloadIcon", "download"],
    ["EditIcon", "pencil"],
    ["ErrorIcon", "triangle-alert"],
    ["ExternalLinkIcon", "external-link"],
    ["FeedbackIcon", "message-square-warning"],
    ["FeedIcon", "rows-3"],
    ["GiveIcon", "gift"],
    ["HomeIcon", "house"],
    ["InfoIcon", "info"],
    ["ImprintIcon", "file-badge"],
    ["LinkIcon", "link"],
    ["LockIcon", "lock"],
    ["NotificationIcon", "bell"],
    ["MailIcon", "mail"],
    ["ReportIcon", "message-square-warning"],
    ["SafetyIcon", "shield-check"],
    ["SearchIcon", "search"],
    ["SettingsIcon", "settings"],
    ["SuccessIcon", "circle-check"],
    ["TrophyIcon", "trophy"],
    ["WorldIcon", "globe"],
    ["UploadIcon", "upload"],
    ["PauseIcon", "pause"],
    ["UnmuteIcon", "volume-2"],
  ] as const)("%s renders the %s glyph", async (component, glyph) => {
    const Icon = Icons[component] as React.ComponentType<object>;
    await render(<Icon />);
    expect(renderedNames()).toEqual([glyph]);
  });

  it("uses default sizes for icons that define one", async () => {
    await render(<Icons.CloseIcon />);
    await render(<Icons.SearchIcon />);
    await render(<Icons.LinkIcon />);
    expect(mockLucide.mock.calls.every(([props]) => props.size)).toBe(true);
  });

  it("lets callers override the default size", async () => {
    await render(<Icons.CloseIcon size={7} />);
    expect(mockLucide.mock.calls[0][0].size).toBe(7);
  });

  it.each(["left", "right", "up", "down"] as const)(
    "ChevronIcon renders chevron-%s",
    async (direction) => {
      await render(<Icons.ChevronIcon direction={direction} />);
      expect(renderedNames()).toEqual([`chevron-${direction}`]);
    },
  );

  it("PlayIcon renders the play glyph", async () => {
    await render(<Icons.PlayIcon />);
    expect(renderedNames()).toEqual(["play"]);
  });

  it("StatisticsIcon renders the given glyph", async () => {
    await render(<Icons.StatisticsIcon name="zap" />);
    expect(renderedNames()).toEqual(["zap"]);
  });

  describe("StarIcon", () => {
    it("renders the outlined font glyph by default", async () => {
      await render(<Icons.StarIcon />);
      expect(renderedNames()).toEqual(["star"]);
    });

    it("draws a filled SVG when filled", async () => {
      await render(<Icons.StarIcon filled color="red" />);
      expect(mockLucide).not.toHaveBeenCalled();
    });
  });

  it("HeartIcon and CodeIcon are drawn as SVGs", async () => {
    await render(<Icons.HeartIcon color="red" size={20} />);
    await render(<Icons.CodeIcon color="red" />);
    expect(mockLucide).not.toHaveBeenCalled();
  });

  describe("ShareIcon", () => {
    const original = Platform.OS;
    afterEach(() => {
      Platform.OS = original;
    });

    it.each([
      ["ios", "share"],
      ["android", "share-2"],
    ] as const)("uses the right glyph on %s", async (os, glyph) => {
      Platform.OS = os;
      await render(<Icons.ShareIcon />);
      expect(renderedNames()).toEqual([glyph]);
    });
  });
});
