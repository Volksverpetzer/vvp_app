import { useState } from "react";
import { View } from "react-native";

import FavCounter from "#/components/counter/FavCounter";
import ShareCounter from "#/components/counter/ShareCounter";
import { globalStyles } from "#/constants/GlobalStyles";
import { multishare } from "#/helpers/Sharing";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type { FaveableType, InstaPostProperties, ShareableType } from "#/types";

interface ShareBarProperties {
  shareable: ShareableType[];
  contentFavIdentifier?: string;
  contentType?: FaveableType;
  favPayload?: InstaPostProperties;
  hideShareCount?: boolean;
}

const ShareBar = (properties: ShareBarProperties) => {
  const {
    shareable,
    hideShareCount,
    contentFavIdentifier,
    contentType,
    favPayload,
  } = properties;
  const [shares, setShares] = useState(0);

  const onPress = async () => {
    const result = await multishare(shareable, { location: "Feed" });
    if (result) setShares(shares + 1);
  };

  const color = useCorporateColor();
  const fontSize = 16;
  return (
    <View
      style={[
        globalStyles.row,
        {
          paddingHorizontal: 26,
          paddingVertical: 10,
          justifyContent: "flex-start",
          gap: 30,
        },
      ]}
    >
      <ShareCounter
        shares={shares}
        shareable={shareable}
        style={{ color, fontSize }}
        color={color}
        hideCount={hideShareCount}
        onPress={onPress}
      />
      {contentFavIdentifier && contentType && (
        <FavCounter
          shareable={shareable}
          contentFavIdentifier={contentFavIdentifier}
          contentType={contentType}
          favPayload={favPayload}
          style={{ color, fontSize }}
        />
      )}
    </View>
  );
};

export default ShareBar;
