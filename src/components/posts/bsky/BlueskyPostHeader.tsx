import { Image } from "expo-image";
import { View } from "react-native";

import UiText from "#/components/ui/UiText";
import type { PostAuthor } from "#/types";

interface BlueskyPostHeaderProps {
  author: PostAuthor;
}

export const BlueskyPostHeader = ({ author }: BlueskyPostHeaderProps) => {
  const displayName = author.display_name ?? author.handle;
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        width: "100%",
        gap: 10,
      }}
    >
      <Image
        source={{ uri: author.avatar }}
        style={{ width: 40, height: 40, borderRadius: 20 }}
      />
      <UiText bold size="lg">
        {displayName}
      </UiText>
    </View>
  );
};
