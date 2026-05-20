import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import Collapsable from "#/components/design/Collapsable";

jest.mock("#/components/Icons", () => ({
  ChevronIcon: jest.fn(() => null),
}));

jest.mock("#/components/typography/Heading", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});

describe("Collapsable", () => {
  it("renders the title", () => {
    const { getByText } = render(<Collapsable title="FAQ" />);
    expect(getByText("FAQ")).toBeTruthy();
  });

  it("hides children when collapsed by default", () => {
    const { queryByText } = render(
      <Collapsable title="FAQ">
        <Text>hidden content</Text>
      </Collapsable>,
    );
    expect(queryByText("hidden content")).toBeNull();
  });

  it("shows children when defaultOpen is true", () => {
    const { getByText } = render(
      <Collapsable title="FAQ" defaultOpen>
        <Text>visible content</Text>
      </Collapsable>,
    );
    expect(getByText("visible content")).toBeTruthy();
  });

  it("expands on press", () => {
    const { getByRole, getByText } = render(
      <Collapsable title="FAQ">
        <Text>now visible</Text>
      </Collapsable>,
    );
    fireEvent.press(getByRole("button"));
    expect(getByText("now visible")).toBeTruthy();
  });

  it("collapses after a second press", () => {
    const { getByRole, queryByText } = render(
      <Collapsable title="FAQ">
        <Text>content</Text>
      </Collapsable>,
    );
    fireEvent.press(getByRole("button"));
    fireEvent.press(getByRole("button"));
    expect(queryByText("content")).toBeNull();
  });

  it("calls onToggle with the new open state", () => {
    const onToggle = jest.fn();
    const { getByRole } = render(
      <Collapsable title="FAQ" onToggle={onToggle} />,
    );
    fireEvent.press(getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(true);
    fireEvent.press(getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("renders an optional icon", () => {
    const { getByText } = render(
      <Collapsable title="FAQ" icon={<Text>icon</Text>} />,
    );
    expect(getByText("icon")).toBeTruthy();
  });
});
