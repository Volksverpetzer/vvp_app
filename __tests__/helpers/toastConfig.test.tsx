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
    "prefixes the %s toast's testID so it can be queried independently",
    async (type) => {
      const { getByTestId } = await render(
        <>{toastConfig[type](makeParams({ type }))}</>,
      );
      expect(getByTestId(`toast.${type}TouchableContainer`)).toBeTruthy();
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

  it("renders the share toast's items via ToastShareSheet", async () => {
    const onCancel = jest.fn();
    const { getByText } = await render(
      <>
        {toastConfig.share(
          makeParams({
            type: "share",
            props: {
              items: [{ title: "Link kopieren", onPress: jest.fn() }],
              onCancel,
            },
          }),
        )}
      </>,
    );
    expect(getByText("Link kopieren")).toBeTruthy();
  });
});
