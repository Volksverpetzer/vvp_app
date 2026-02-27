import * as Linking from "expo-linking";
import type { Href } from "expo-router";
import { Redirect, useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

import Config from "#/constants/Config";
import { useOptionalShareIntent } from "#/hooks/useOptionalShareIntent";

const ShareIntent = () => {
  const router = useRouter();
  const { hasShareIntent, shareIntent, error } = useOptionalShareIntent();

  return (
    <View>
      {(() => {
        if (!hasShareIntent) {
          return <Text>No Share intent detected</Text>;
        }
        if (shareIntent?.type === "weburl") {
          try {
            const { path } = Linking.parse(shareIntent.webUrl);
            // If it's our domain, route inside the app
            if (shareIntent.webUrl.includes(Config.wpUrl)) {
              // ensure leading slash
              const href = path.startsWith("/") ? path : "/" + path;
              return <Redirect href={href as Href} />;
            }
          } catch {}
          // fallback to search page
          return (
            <Redirect
              href={{
                pathname: "/search",
                params: { tag: shareIntent.webUrl },
              }}
            />
          );
        }
        if (shareIntent?.type === "text" && shareIntent.text) {
          return (
            <Redirect
              href={{ pathname: "/search", params: { tag: shareIntent.text } }}
            />
          );
        }
      })()}
      <Text>{error}</Text>
      <Button onPress={() => router.replace("/")} title="Go home" />
    </View>
  );
};

export default ShareIntent;
