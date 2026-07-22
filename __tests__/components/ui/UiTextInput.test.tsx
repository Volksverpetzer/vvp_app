import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";

import UiTextInput from "#/components/ui/UiTextInput";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { surfaceInput: "#BADDE8", text: "#111" },
    dark: { surfaceInput: "#777", text: "#F7F7F7" },
  },
}));

const flatStyle = (style: unknown) =>
  ([] as unknown[])
    .concat(style)
    .reduce<Record<string, unknown>>((acc, s: any) => ({ ...acc, ...s }), {});

describe("TextInput", () => {
  beforeEach(() => {
    jest.mocked(useAppColorScheme).mockReturnValue("light");
  });

  it("renders with light theme colors", async () => {
    const { getByTestId } = await render(<UiTextInput testID="input" />);
    const style = flatStyle(getByTestId("input").props.style);
    expect(style.backgroundColor).toBe("#BADDE8");
    expect(style.color).toBe("#111");
  });

  it("renders with dark theme colors", async () => {
    jest.mocked(useAppColorScheme).mockReturnValue("dark");
    const { getByTestId } = await render(<UiTextInput testID="input" />);
    const style = flatStyle(getByTestId("input").props.style);
    expect(style.backgroundColor).toBe("#777");
    expect(style.color).toBe("#F7F7F7");
  });

  it("merges additional style props", async () => {
    const { getByTestId } = await render(
      <UiTextInput testID="input" style={{ borderWidth: 1 }} />,
    );
    const style = flatStyle(getByTestId("input").props.style);
    expect(style.borderWidth).toBe(1);
    expect(style.backgroundColor).toBe("#BADDE8");
  });

  it("passes through other props", async () => {
    const { getByTestId } = await render(
      <UiTextInput testID="input" placeholder="Search..." editable={false} />,
    );
    const input = getByTestId("input");
    expect(input.props.placeholder).toBe("Search...");
    expect(input.props.editable).toBe(false);
  });
});
