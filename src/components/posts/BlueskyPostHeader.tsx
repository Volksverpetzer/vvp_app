import { Image } from "expo-image";

import View from "#/components/design/View";
import Heading from "#/components/typography/Heading";
import type { PostAuthor } from "#/types";

type BlueskyPostHeaderProps = {
  author: PostAuthor;
};

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
      <Heading>{displayName}</Heading>
    </View>
  );
};
