import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import UiCollapsable from "#/components/ui/UiCollapsable";

jest.mock("#/components/Icons", () => ({
  ChevronIcon: jest.fn(() => null),
}));

jest.mock("#/components/typography/Heading", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});

describe("Collapsable", () => {
  it("renders the title", () => {
    const { getByText } = render(<UiCollapsable title="FAQ" />);
    expect(getByText("FAQ")).toBeTruthy();
  });

  it("hides children when collapsed by default", () => {
    const { queryByText } = render(
      <UiCollapsable title="FAQ">
        <Text>hidden content</Text>
      </UiCollapsable>,
    );
    expect(queryByText("hidden content")).toBeNull();
  });

  it("shows children when defaultOpen is true", () => {
    const { getByText } = render(
      <UiCollapsable title="FAQ" defaultOpen>
        <Text>visible content</Text>
      </UiCollapsable>,
    );
    expect(getByText("visible content")).toBeTruthy();
  });

  it("expands on press", () => {
    const { getByRole, getByText } = render(
      <UiCollapsable title="FAQ">
        <Text>now visible</Text>
      </UiCollapsable>,
    );
    fireEvent.press(getByRole("button"));
    expect(getByText("now visible")).toBeTruthy();
  });

  it("collapses after a second press", () => {
    const { getByRole, queryByText } = render(
      <UiCollapsable title="FAQ">
        <Text>content</Text>
      </UiCollapsable>,
    );
    fireEvent.press(getByRole("button"));
    fireEvent.press(getByRole("button"));
    expect(queryByText("content")).toBeNull();
  });

  it("calls onToggle with the new open state", () => {
    const onToggle = jest.fn();
    const { getByRole } = render(
      <UiCollapsable title="FAQ" onToggle={onToggle} />,
    );
    fireEvent.press(getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(true);
    fireEvent.press(getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("renders an optional icon", () => {
    const { getByText } = render(
      <UiCollapsable title="FAQ" icon={<Text>icon</Text>} />,
    );
    expect(getByText("icon")).toBeTruthy();
  });
});
