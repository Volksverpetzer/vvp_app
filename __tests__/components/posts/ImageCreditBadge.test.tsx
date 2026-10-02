import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import ImageCreditBadge from "#/components/posts/ImageCreditBadge";

const mockUseAppColorScheme = jest.fn();
const mockInfoIcon = jest.fn((_props: { color: string; size: number }) => null);

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => mockUseAppColorScheme(),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { iconSubtle: "#8b8b8b-light" },
    dark: { iconSubtle: "#8b8b8b-dark" },
  },
}));

jest.mock("#/components/Icons", () => ({
  InfoIcon: (props: { color: string; size: number }) => mockInfoIcon(props),
}));

jest.mock("#/components/ui/UiBadge", () => {
  const { TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({
      children,
      onPress,
      accessibilityLabel,
      accessibilityHint,
    }: any) => (
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </TouchableOpacity>
    ),
  };
});

jest.mock("#/components/popups/ImageCreditModal", () => {
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ isVisible, credit }: any) =>
      isVisible ? <Text testID="credit-modal">{credit.source}</Text> : null,
  };
});

const credit = { source: "Jane Doe / dpa" };

describe("ImageCreditBadge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppColorScheme.mockReturnValue("light");
  });

  it("renders nothing without a credit", async () => {
    const { toJSON } = await render(
      <ImageCreditBadge position="bottomRight" />,
    );
    expect(toJSON()).toBeNull();
  });

  it("colors the info icon with the iconSubtle token (light)", async () => {
    await render(<ImageCreditBadge credit={credit} position="bottomRight" />);
    expect(mockInfoIcon.mock.calls[0][0].color).toBe("#8b8b8b-light");
  });

  it("uses the dark scheme's iconSubtle in dark mode", async () => {
    mockUseAppColorScheme.mockReturnValue("dark");
    await render(<ImageCreditBadge credit={credit} position="bottomRight" />);
    expect(mockInfoIcon.mock.calls[0][0].color).toBe("#8b8b8b-dark");
  });

  it("opens the credit modal when the badge is pressed", async () => {
    const { getByLabelText, queryByTestId, getByTestId } = await render(
      <ImageCreditBadge credit={credit} position="bottomRight" />,
    );
    expect(queryByTestId("credit-modal")).toBeNull();
    await fireEvent.press(getByLabelText("Bildquelle anzeigen"));
    expect(getByTestId("credit-modal")).toBeTruthy();
  });
});
