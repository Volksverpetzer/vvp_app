import { render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import BlockRenderer from "#/screens/Home/components/article/renderer/BlockRenderer";
import type { HttpsUrl } from "#/types";

jest.mock("#/helpers/provider/SettingsProvider", () => {
  const { createContext } = require("react");
  return {
    SettingsContext: createContext({ advancedSettings: {} }),
  };
});

jest.mock(
  "#/screens/Home/components/article/renderer/ReportingWrapper",
  () =>
    function MockReportingWrapper({ children }: { children: React.ReactNode }) {
      const { View: RNView } = jest.requireActual("react-native");
      return <RNView testID="reporting-wrapper">{children}</RNView>;
    },
);

const url = "https://example.com/article" as HttpsUrl;
const MockRenderer = ({ testID }: { testID?: string }) => (
  <Text testID={testID ?? "default-renderer"}>rendered</Text>
);

const baseRenderProps = {
  TDefaultRenderer: MockRenderer as React.FC<Record<string, unknown>>,
  renderIndex: 0,
};

const wrap = async (ui: React.ReactElement, advancedReporting = false) =>
  await render(
    <SettingsContext.Provider
      value={{
        advancedSettings: {
          advancedReporting: { value: advancedReporting, name: "" },
        } as any,
        contentSettings: {} as any,
        setAdvancedSettings: jest.fn(),
        setContentSettings: jest.fn(),
      }}
    >
      {ui}
    </SettingsContext.Provider>,
  );

describe("BlockRenderer", () => {
  it("renders nothing when TDefaultRenderer is absent from renderProps", async () => {
    const { toJSON } = await wrap(
      <BlockRenderer renderProps={{ renderIndex: 0 } as any} url={url} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders the TDefaultRenderer content without a ReportingWrapper by default", async () => {
    const { getByTestId, queryByTestId } = await wrap(
      <BlockRenderer renderProps={baseRenderProps} url={url} />,
    );
    expect(getByTestId("default-renderer")).toBeTruthy();
    expect(queryByTestId("reporting-wrapper")).toBeNull();
  });

  it("wraps content in ReportingWrapper when advancedReporting is enabled", async () => {
    const { getByTestId } = await wrap(
      <BlockRenderer renderProps={baseRenderProps} url={url} />,
      true,
    );
    expect(getByTestId("reporting-wrapper")).toBeTruthy();
    expect(getByTestId("default-renderer")).toBeTruthy();
  });

  it("passes renderIndex to ReportingWrapper", async () => {
    const { getByTestId } = await wrap(
      <BlockRenderer
        renderProps={{ ...baseRenderProps, renderIndex: 3 }}
        url={url}
      />,
      true,
    );
    expect(getByTestId("reporting-wrapper")).toBeTruthy();
  });
});
