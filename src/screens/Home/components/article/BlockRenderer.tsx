import { FC, useContext, useState } from "react";
import { View } from "react-native";

import SettingsContext from "#/helpers/SettingsContext";

import ReportingWrapper from "./BlockRendererReporting";

interface BlockRenderProperties {
  renderProps: {
    TDefaultRenderer: FC<Record<string, unknown>>;
    renderIndex: number;
  };
  url: string;
}

/**
 * BlockRenderer: Basis‑Rendering und Höhenmessung.
 */
const BlockRenderer = (properties: BlockRenderProperties) => {
  const { advancedSettings } = useContext(SettingsContext);
  const [blockHeight, setHeight] = useState(0);

  if (!("TDefaultRenderer" in properties.renderProps)) {
    return undefined;
  }

  const DefaultRender = () => (
    <View
      style={{
        alignSelf: "stretch",
        maxWidth: "100%",
        width: "100%",
      }}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        setHeight(height);
      }}
    >
      <properties.renderProps.TDefaultRenderer {...properties.renderProps} />
    </View>
  );

  if (advancedSettings.advancedReporting?.value === true) {
    return (
      <ReportingWrapper
        url={properties.url}
        renderIndex={properties.renderProps.renderIndex}
        blockHeight={blockHeight}
      >
        <DefaultRender />
      </ReportingWrapper>
    );
  }

  return <DefaultRender />;
};

export default BlockRenderer;
