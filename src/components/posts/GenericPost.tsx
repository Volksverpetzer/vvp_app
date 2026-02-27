import type { FC } from "react";
import React, { useEffect, useMemo, useState } from "react";
import type { ViewStyle } from "react-native";

import ShareBar from "#/components/bars/ShareBar";
import View from "#/components/design/View";
import { styles } from "#/constants/Styles";
import type { ShareableType } from "#/helpers/Sharing";
import type { FaveableType } from "#/types";

interface ComponentProperty<T> {
  component: FC<{ inView: boolean } & T>;
  data: T;
  style?: ViewStyle;
  shareable?: ShareableType[];
  contentFavIdentifier?: string;
  contentType?: FaveableType;
  inView: boolean;
  hideShareCount?: boolean;
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
    hideShareCount,
    inView,
    shareable,
    style,
  } = properties;
  // Flag to mark if the component has been in view at least once.
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    if (inView && !hasBeenInView) {
      setHasBeenInView(true);
    }
  }, [inView, hasBeenInView]);

  // Memoize the combined style to avoid re-creating the style object on every render.
  const combinedStyle: ViewStyle = useMemo(
    () => ({ ...styles.roundEdges, ...style }),
    [style],
  );

  return (
    <View style={combinedStyle}>
      <Component inView={hasBeenInView} {...data} />
      {shareable ? (
        <ShareBar
          shareable={shareable}
          hideShareCount={hideShareCount || !inView}
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
