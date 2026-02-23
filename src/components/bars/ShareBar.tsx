import { useState } from "react";
import { Pressable } from "react-native";

import { ShareIcon } from "#/components/Icons";
import FavCounter from "#/components/counter/FavCounter";
import ShareCounter from "#/components/counter/ShareCounter";
import View from "#/components/design/View";
import { styles } from "#/constants/Styles";
import { ShareableType, multishare } from "#/helpers/Sharing";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import { FaveableType } from "#/types";

interface ShareBarProperties {
  shareable: ShareableType[];
  contentFavIdentifier?: string;
  contentType?: FaveableType;
  hideShareCount?: boolean;
}

const ShareBar = (properties: ShareBarProperties) => {
  const { shareable, hideShareCount, contentFavIdentifier, contentType } =
    properties;
  const [shares, setShares] = useState(0);

  const onPress = async () => {
    const result = await multishare(shareable, { location: "Feed" });
    if (result) setShares(shares + 1);
  };

  const color = useCorporateColor();
  const fontSize = 16;
  return (
    <View
      style={{
        paddingHorizontal: 26,
        paddingVertical: 10,
        ...styles.row,
        justifyContent: "flex-start",
        gap: 30,
      }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onLongPress={onPress}
        hitSlop={20}
        style={({ pressed }) => {
          return {
            left: 0,
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            alignContent: "center",
            backgroundColor: pressed ? "rgba(120,120,120,0.6)" : undefined,
            height: "100%",
          };
        }}
      >
        <ShareIcon color={color} />
        {hideShareCount ? (
          <View style={{ width: "70%" }} />
        ) : (
          <ShareCounter
            shares={shares}
            shareable={shareable}
            style={{ color, fontSize }}
          />
        )}
      </Pressable>
      {contentFavIdentifier && contentType && (
        <FavCounter
          shareable={shareable}
          contentFavIdentifier={contentFavIdentifier}
          contentType={contentType}
          style={{ color, fontSize }}
        />
      )}
    </View>
  );
};

export default ShareBar;
