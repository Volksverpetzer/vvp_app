import type { FC } from "react";
import React, { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import ShareBar from "#/components/bars/ShareBar";
import UiCard from "#/components/ui/UiCard";
import { POST_PADDING_HORIZONTAL } from "#/constants/GlobalStyles";
import type {
  FavPayload,
  FaveableType,
  InstaPostProperties,
  PodcastEpisodeProperties,
  ShareableType,
} from "#/types";
import { FAV_TYPE_INSTA, FAV_TYPE_PODCAST } from "#/types";

// Snapshot `data` into the favorite for the content types that can't be
// re-fetched by id (Instagram, podcast); other types reload by URL/slug.
const favPayloadFor = (
  contentType: FaveableType | undefined,
  data: object,
): FavPayload | undefined => {
  if (contentType === FAV_TYPE_INSTA) return data as InstaPostProperties;
  if (contentType === FAV_TYPE_PODCAST) return data as PodcastEpisodeProperties;
  return undefined;
};

interface ComponentProperty<T> {
  component: FC<{ inView: boolean } & T>;
  data: T;
  style?: StyleProp<ViewStyle>;
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
  const combinedStyle: StyleProp<ViewStyle> = useMemo(
    () => [{ minHeight: 200, overflow: "hidden", padding: 0 }, style],
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
          // For Instagram posts and podcast episodes `data` is the item itself;
          // snapshot it into the favorite so it survives without a by-id fetch.
          favPayload={favPayloadFor(contentType, data)}
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
