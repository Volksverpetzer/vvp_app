import { Image } from "expo-image";

import View from "#/components/design/View";
import Heading from "#/components/typography/Heading";

// The AT Proto SDK types use camelCase, but our Python backend returns snake_case.
type Author = {
  display_name?: string;
  handle: string;
  avatar?: string;
};

type Props = {
  author: Author;
};

export const BlueskyPostHeader = ({ author }: Props) => {
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
