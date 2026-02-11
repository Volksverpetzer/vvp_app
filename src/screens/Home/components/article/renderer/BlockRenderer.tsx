import { FC, useContext } from "react";
import { View } from "react-native";

import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import ReportingWrapper from "#/screens/Home/components/article/renderer/ReportingWrapper";
import { HttpsUrl } from "#/types";

interface BlockRenderProperties {
  renderProps: {
    TDefaultRenderer: FC<Record<string, unknown>>;
    renderIndex: number;
  };
  url: HttpsUrl;
}

/**
 * BlockRenderer: Basis‑Rendering und Höhenmessung.
 */
const BlockRenderer = (properties: BlockRenderProperties) => {
  const { advancedSettings } = useContext(SettingsContext);

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
    >
      <properties.renderProps.TDefaultRenderer {...properties.renderProps} />
    </View>
  );

  if (advancedSettings.advancedReporting?.value === true) {
    return (
      <ReportingWrapper
        url={properties.url}
        renderIndex={properties.renderProps.renderIndex}
      >
        <DefaultRender />
      </ReportingWrapper>
    );
  }

  return <DefaultRender />;
};

export default BlockRenderer;
