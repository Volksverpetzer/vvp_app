import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import BackToTopButton from "#/components/buttons/BackToTopButton";

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    View: require("react-native").View,
  },
  FadeInDown: {},
  FadeOutDown: {},
}));

describe("BackToTopButton", () => {
  it("renders nothing when not visible", async () => {
    const { toJSON } = await render(
      <BackToTopButton visible={false} onPress={jest.fn()} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders an accessible button when visible", async () => {
    const { getByLabelText } = await render(
      <BackToTopButton visible={true} onPress={jest.fn()} />,
    );
    expect(getByLabelText("Zurück nach oben")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await render(
      <BackToTopButton visible={true} onPress={onPress} />,
    );
    await fireEvent.press(getByLabelText("Zurück nach oben"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
