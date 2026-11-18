import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { ToastConfigParams } from "react-native-toast-message";

import { toastConfig } from "#/helpers/toastConfig";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ canGoBack: jest.fn(), replace: jest.fn() })),
}));

const makeParams = (
  overrides: Partial<ToastConfigParams<unknown>> = {},
): ToastConfigParams<unknown> => ({
  position: "bottom",
  type: "success",
  isVisible: true,
  visibilityTime: 3000,
  text1: "Title",
  text2: "Details",
  show: jest.fn(),
  hide: jest.fn(),
  onPress: jest.fn(),
  props: {},
  ...overrides,
});

describe("toastConfig", () => {
  it.each(["success", "info", "error"] as const)(
    "renders the %s toast as an AppToast with its own testID",
    async (type) => {
      const { getByTestId, getByText } = await render(
        <>{toastConfig[type](makeParams({ type }))}</>,
      );
      expect(getByTestId(`toast.${type}`)).toBeTruthy();
      expect(getByText("Title")).toBeTruthy();
      expect(getByText("Details")).toBeTruthy();
    },
  );

  it.each(["success", "info", "error"] as const)(
    "does not turn the %s toast into a button for the library's no-op onPress",
    async (type) => {
      const { queryByRole } = await render(
        <>{toastConfig[type](makeParams({ type }))}</>,
      );
      expect(queryByRole("button")).toBeNull();
    },
  );

  it("renders the achievement toast's text via MissionPopup", async () => {
    const { getByText } = await render(
      <>
        {toastConfig.achievement(
          makeParams({ type: "achievement", text1: "Erfolg", text2: "Yay" }),
        )}
      </>,
    );
    expect(getByText("Erfolg")).toBeTruthy();
    expect(getByText("Yay")).toBeTruthy();
  });
});
