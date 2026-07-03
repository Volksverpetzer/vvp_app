import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import EmptyComponent from "#/components/views/EmptyComponent";

jest.mock("#/components/ui/UiEmptyState", () => {
  const { Pressable, View, Text } = require("react-native");
  return jest.fn(({ icon, children, onPress }: any) => {
    const Wrapper = onPress ? Pressable : View;
    return (
      <Wrapper
        accessibilityRole={onPress ? "button" : undefined}
        onPress={onPress}
      >
        {icon}
        <Text>{children}</Text>
      </Wrapper>
    );
  });
});

jest.mock("#/components/ui/UiCard", () => {
  const { View } = require("react-native");
  return jest.fn(({ children }: any) => <View testID="card">{children}</View>);
});

jest.mock("#/components/views/Donate", () => () => null);

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});

jest.mock("#/components/Icons", () => {
  const { Text } = require("react-native");
  return {
    HeartIcon: jest.fn(() => <Text testID="heart-icon">♥</Text>),
  };
});

const Icon = () => <Text testID="custom-icon">icon</Text>;

describe("EmptyComponent", () => {
  it("renders the text", async () => {
    const { getByText } = await render(
      <EmptyComponent text="Nichts gefunden" icon={<Icon />} />,
    );
    expect(getByText("Nichts gefunden")).toBeTruthy();
  });

  it("renders the icon", async () => {
    const { getByTestId } = await render(
      <EmptyComponent text="Nichts gefunden" icon={<Icon />} />,
    );
    expect(getByTestId("custom-icon")).toBeTruthy();
  });

  it("always renders the donate card", async () => {
    const { getByTestId, getByTestId: g } = await render(
      <EmptyComponent text="text" icon={<Icon />} />,
    );
    expect(getByTestId("card")).toBeTruthy();
    expect(g("heart-icon")).toBeTruthy();
  });

  it("renders children between the empty state and the donate card", async () => {
    const { getByTestId } = await render(
      <EmptyComponent text="text" icon={<Icon />}>
        <Text testID="slot-content">between</Text>
      </EmptyComponent>,
    );
    expect(getByTestId("slot-content")).toBeTruthy();
  });

  it("renders without children", () => {
    expect(
      async () => await render(<EmptyComponent text="text" icon={<Icon />} />),
    ).not.toThrow();
  });

  it("forwards onPress to the empty state", async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <EmptyComponent text="text" icon={<Icon />} onPress={onPress} />,
    );
    await fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
