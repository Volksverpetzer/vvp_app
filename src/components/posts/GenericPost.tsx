import type { FC } from "react";
import React, { useMemo } from "react";
import type { ViewStyle } from "react-native";

import ShareBar from "#/components/bars/ShareBar";
import View from "#/components/design/View";
import type { FaveableType, ShareableType } from "#/types";

interface ComponentProperty<T> {
  component: FC<{ inView: boolean } & T>;
  data: T;
  style?: ViewStyle;
  shareable?: ShareableType[];
  contentFavIdentifier?: string;
  contentType?: FaveableType;
  inView: boolean;
}

/**
 * Renders Round Edged around any Post Component.
 */
const GenericPost = (properties: ComponentProperty<object>) => {
  const {
    component: Component,
    contentFavIdentifier,
    contentType,
    data,
    inView,
    shareable,
    style,
  } = properties;
  // Memoize the combined style to avoid re-creating the style object on every render.
  const combinedStyle: ViewStyle = useMemo(
    () => ({
      borderRadius: 15,
      minHeight: 200,
      overflow: "hidden",
      ...style,
    }),
    [style],
  );

  return (
    <View style={combinedStyle}>
      <Component inView={inView} {...data} />
      {shareable ? (
        <ShareBar
          shareable={shareable}
          hideShareCount={!inView}
          contentFavIdentifier={contentFavIdentifier}
          contentType={contentType}
        />
      ) : (
        <View style={{ paddingHorizontal: 30, height: 40, margin: 0 }} />
      )}
    </View>
  );
};

export default React.memo(GenericPost);
