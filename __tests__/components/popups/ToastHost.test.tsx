import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import Toast from "react-native-toast-message";

import ToastHost, { toastBottomOffset } from "#/components/popups/ToastHost";
import { toastConfig } from "#/helpers/toastConfig";

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

describe("ToastHost", () => {
  it("puts every toast at the bottom, above the tab bar", async () => {
    await render(<ToastHost />);
    expect(jest.mocked(Toast).mock.calls[0][0]).toMatchObject({
      config: toastConfig,
      position: "bottom",
      bottomOffset: toastBottomOffset(34),
    });
  });

  it("keeps the toast clear of the safe area and the tab bar", () => {
    // The test environment runs as iOS: 49pt tab bar plus a small gap
    expect(toastBottomOffset(34)).toBeGreaterThan(34 + 49);
    expect(toastBottomOffset(0)).toBeGreaterThan(49);
  });
});
