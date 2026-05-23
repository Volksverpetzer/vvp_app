import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";

import TextInput from "#/components/design/TextInput";

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { inputBackground: "#BADDE8", text: "#111" },
    dark: { inputBackground: "#777", text: "#F7F7F7" },
  },
}));

describe("TextInput", () => {
  beforeEach(() => {
    const { useAppColorScheme } = require("#/hooks/useAppColorScheme");
    (useAppColorScheme as jest.Mock).mockReturnValue("light");
  });

  it("renders with light theme colors", () => {
    const { getByTestId } = render(<TextInput testID="input" />);
    const input = getByTestId("input");
    const flatStyle = []
      .concat(input.props.style)
      .reduce((acc: any, s: any) => ({ ...acc, ...s }), {});
    expect(flatStyle.backgroundColor).toBe("#BADDE8");
    expect(flatStyle.color).toBe("#111");
  });

  it("renders with dark theme colors", () => {
    const { useAppColorScheme } = require("#/hooks/useAppColorScheme");
    (useAppColorScheme as jest.Mock).mockReturnValue("dark");

    const { getByTestId } = render(<TextInput testID="input" />);
    const input = getByTestId("input");
    const flatStyle = []
      .concat(input.props.style)
      .reduce((acc: any, s: any) => ({ ...acc, ...s }), {});
    expect(flatStyle.backgroundColor).toBe("#777");
    expect(flatStyle.color).toBe("#F7F7F7");
  });

  it("merges additional style props", () => {
    const { getByTestId } = render(
      <TextInput testID="input" style={{ borderWidth: 1 }} />,
    );
    const input = getByTestId("input");
    const flatStyle = []
      .concat(input.props.style)
      .reduce((acc: any, s: any) => ({ ...acc, ...s }), {});
    expect(flatStyle.borderWidth).toBe(1);
    expect(flatStyle.backgroundColor).toBe("#BADDE8");
  });

  it("passes through other props", () => {
    const { getByTestId } = render(
      <TextInput testID="input" placeholder="Search..." editable={false} />,
    );
    const input = getByTestId("input");
    expect(input.props.placeholder).toBe("Search...");
    expect(input.props.editable).toBe(false);
  });
});
