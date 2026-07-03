import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ShareCounter from "#/components/counter/ShareCounter";
import { getShares } from "#/helpers/network/Engagement";
import type { ShareableType } from "#/types";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { enableEngagement: true },
}));

const mockConfig = jest.requireMock("#/constants/Config").default as {
  enableEngagement: boolean;
};

jest.mock("#/components/Icons", () => ({
  ShareIcon: ({ color, size }: { color?: string; size?: number }) => {
    const { Text: MockText } = jest.requireActual("react-native");
    return (
      <MockText>{`share-icon:${color ?? "none"}:${size ?? "default"}`}</MockText>
    );
  },
}));

jest.mock("#/helpers/network/Engagement", () => ({
  getShares: jest.fn(),
}));

const shareable = [
  { url: "https://example.com/one", title: "One" },
  { url: "https://example.com/two", title: "Two" },
] as ShareableType[];

describe("ShareCounter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig.enableEngagement = true;
    jest.mocked(getShares).mockResolvedValue(0);
  });

  it("loads share counts for every shareable URL and adds the provided local count", async () => {
    jest
      .mocked(getShares)
      .mockImplementation((url) =>
        Promise.resolve(url === "https://example.com/one" ? 4 : 6),
      );

    const { getByText } = await render(
      <ShareCounter
        shareable={shareable}
        shares={2}
        style={{}}
        color="#ff00aa"
        size={24}
      />,
    );

    await waitFor(() => {
      expect(getByText("12")).toBeTruthy();
    });

    expect(getByText("share-icon:#ff00aa:24")).toBeTruthy();
    expect(getShares).toHaveBeenNthCalledWith(1, "https://example.com/one");
    expect(getShares).toHaveBeenNthCalledWith(2, "https://example.com/two");
  });

  it("skips fetching remote counts when the count is hidden", async () => {
    const { getByText } = await render(
      <ShareCounter shareable={shareable} shares={7} style={{}} hideCount />,
    );

    const hiddenCount = getByText("7", { includeHiddenElements: true });

    expect(hiddenCount.props.accessibilityElementsHidden).toBe(true);
    expect(hiddenCount.props.importantForAccessibility).toBe("no");
    expect(getShares).not.toHaveBeenCalled();
  });

  it("calls onPress from press and long press when interactive", async () => {
    const onPress = jest.fn();

    const { getByRole } = await render(
      <ShareCounter shareable={shareable} style={{}} onPress={onPress} />,
    );

    await fireEvent.press(getByRole("button"));
    await fireEvent(getByRole("button"), "onLongPress");

    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("renders plain content without a button role when onPress is omitted", async () => {
    const { queryByRole, getByText } = await render(
      <ShareCounter shareable={shareable} style={{}} />,
    );

    expect(queryByRole("button")).toBeNull();
    expect(getByText("share-icon:none:20")).toBeTruthy();
  });

  it("renders an empty placeholder and skips engagement when disabled", async () => {
    mockConfig.enableEngagement = false;

    const { queryByRole, queryByText } = await render(
      <ShareCounter shareable={shareable} shares={3} style={{}} />,
    );

    expect(queryByRole("button")).toBeNull();
    expect(queryByText("3")).toBeNull();
    expect(getShares).not.toHaveBeenCalled();
  });
});
