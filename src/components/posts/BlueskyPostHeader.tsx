import type { ProfileViewBasic } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { Image } from "expo-image";

import View from "#/components/design/View";
import Heading from "#/components/typography/Heading";

type Props = {
  author: ProfileViewBasic;
};

export const BlueskyPostHeader = ({ author }: Props) => {
  const displayName = author.displayName ?? author.handle;
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
