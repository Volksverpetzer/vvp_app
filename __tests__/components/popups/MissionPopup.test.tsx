import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import MissionPopup from "#/components/popups/MissionPopup";

const mockNavigate = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({
    navigate: (...args: unknown[]) => mockNavigate(...args),
  }),
}));

jest.mock("#/components/Icons", () => ({
  SuccessIcon: jest.fn(() => null),
  ErrorIcon: jest.fn(() => null),
  InfoIcon: jest.fn(() => null),
  TrophyIcon: jest.fn(() => null),
}));

const renderPopup = () =>
  render(<MissionPopup text1="Geschafft!" text2="Weiter zur Mission" />);

describe("MissionPopup", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders both texts", async () => {
    const { getByText } = await renderPopup();
    expect(getByText("Geschafft!")).toBeTruthy();
    expect(getByText("Weiter zur Mission")).toBeTruthy();
  });

  // dismissTo only popped a stack: from another tab it did nothing.
  // navigate switches tabs and also pops screens pushed above the tabs.
  it("opens the action tab on tap", async () => {
    const { getByTestId } = await renderPopup();
    await fireEvent.press(getByTestId("mission-popup"));
    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/action");
  });

  it("is exposed as a button to screen readers", async () => {
    const { getByRole } = await renderPopup();
    expect(getByRole("button")).toBeTruthy();
  });
});
