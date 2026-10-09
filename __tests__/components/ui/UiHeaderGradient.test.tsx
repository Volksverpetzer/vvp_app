import { render } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import UiHeaderGradient, {
  HEADER_FADE_HEIGHT,
} from "#/components/ui/UiHeaderGradient";

jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return {
    LinearGradient: (props: any) => <View testID="fade" {...props} />,
  };
});

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

describe("UiHeaderGradient", () => {
  it("renders its children", async () => {
    const { getByText } = await render(
      <UiHeaderGradient>
        <Text>content</Text>
      </UiHeaderGradient>,
    );
    expect(getByText("content")).toBeTruthy();
  });

  it("fades over a fixed strip at the bottom regardless of header height", async () => {
    const { getByTestId } = await render(
      <UiHeaderGradient style={{ height: 140 }} />,
    );
    const fade = StyleSheet.flatten(getByTestId("fade").props.style);
    expect(fade.height).toBe(HEADER_FADE_HEIGHT);
    expect(fade.bottom).toBe(0);
  });

  it("starts the fade fully opaque and ends it near transparent", async () => {
    const { getByTestId } = await render(<UiHeaderGradient />);
    const colors: string[] = getByTestId("fade").props.colors;
    expect(colors[0]).toMatch(/,1\)$/);
    expect(colors[colors.length - 1]).toMatch(/,0\.1\)$/);
  });
});
