import type { TNode } from "@native-html/render";
import type { FC } from "react";
import { useContext } from "react";
import { View } from "react-native";

import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import { BodyChunkOffsetContext } from "#/screens/Home/components/article/bodyChunks";
import ReportingWrapper from "#/screens/Home/components/article/renderer/ReportingWrapper";
import type { HttpsUrl } from "#/types";

interface BlockRenderProperties {
  renderProps: {
    TDefaultRenderer: FC<Record<string, unknown>>;
    renderIndex: number;
    tnode?: TNode;
  };
  url: HttpsUrl;
}

/**
 * BlockRenderer: Basis‑Rendering und Höhenmessung.
 */
const BlockRenderer = (properties: BlockRenderProperties) => {
  const { advancedSettings } = useContext(SettingsContext);
  const chunkOffset = useContext(BodyChunkOffsetContext);

  if (!("TDefaultRenderer" in properties.renderProps)) {
    return null;
  }

  const defaultContent = (
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
        // The body renders in chunks; a top-level block's renderIndex is
        // its position within its chunk, not the whole article.
        indexOffset={
          properties.renderProps.tnode?.parent?.tagName === "body"
            ? chunkOffset
            : undefined
        }
      >
        {defaultContent}
      </ReportingWrapper>
    );
  }

  return defaultContent;
};

export default BlockRenderer;
