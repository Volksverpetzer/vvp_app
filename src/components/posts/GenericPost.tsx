import type { FC } from "react";
import React, { useMemo } from "react";
import type { ViewStyle } from "react-native";
import { View } from "react-native";

import ShareBar from "#/components/bars/ShareBar";
import UiCard from "#/components/ui/UiCard";
import { POST_PADDING_HORIZONTAL } from "#/constants/GlobalStyles";
import type { FaveableType, InstaPostProperties, ShareableType } from "#/types";
import { FAV_TYPE_INSTA } from "#/types";

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
  const combinedStyle: ViewStyle = useMemo(
    () => ({ minHeight: 200, overflow: "hidden", padding: 0, ...style }),
    [style],
  );

  return (
    <UiCard style={combinedStyle}>
      <Component inView={inView} {...data} />
      {shareable ? (
        <ShareBar
          shareable={shareable}
          hideShareCount={!inView}
          contentFavIdentifier={contentFavIdentifier}
          contentType={contentType}
          // For Instagram posts `data` is the post itself; snapshot it into the
          // favorite so it survives without the account-scoped by-id proxy.
          favPayload={
            contentType === FAV_TYPE_INSTA
              ? (data as InstaPostProperties)
              : undefined
          }
        />
      ) : (
        <View
          style={{
            paddingHorizontal: POST_PADDING_HORIZONTAL,
            height: 40,
            margin: 0,
          }}
        />
      )}
    </UiCard>
  );
};

export default React.memo(GenericPost);
