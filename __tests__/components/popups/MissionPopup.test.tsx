import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import MissionPopup from "#/components/popups/MissionPopup";

const mockCanGoBack = jest.fn(() => true);
const mockDismissTo = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({
    canGoBack: () => mockCanGoBack(),
    dismissTo: (...args: unknown[]) => mockDismissTo(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  }),
}));

jest.mock("#/components/Icons", () => ({
  SuccessIcon: jest.fn(() => null),
}));

const renderPopup = () =>
  render(<MissionPopup text1="Geschafft!" text2="Weiter zur Mission" />);

describe("MissionPopup", () => {
  beforeEach(() => {
    mockCanGoBack.mockReturnValue(true);
    mockDismissTo.mockClear();
    mockReplace.mockClear();
  });

  it("renders both texts", async () => {
    const { getByText } = await renderPopup();
    expect(getByText("Geschafft!")).toBeTruthy();
    expect(getByText("Weiter zur Mission")).toBeTruthy();
  });

  // Dismissing an existing stack keeps the action tab's scroll position;
  // replacing would rebuild it, so the two branches are not interchangeable.
  it("dismisses back to the action tab when there is a stack to pop", async () => {
    const { getByTestId } = await renderPopup();
    await fireEvent.press(getByTestId("mission-popup"));
    expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/action");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("replaces the route when there is nothing to go back to", async () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByTestId } = await renderPopup();
    await fireEvent.press(getByTestId("mission-popup"));
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/action");
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it("is exposed as a button to screen readers", async () => {
    const { getByRole } = await renderPopup();
    expect(getByRole("button")).toBeTruthy();
  });
});
