import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import Collapsable from "#/components/design/Collapsable";
import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import { outBoundLinkPress } from "#/helpers/Linking";
import { getLinks } from "#/helpers/Networking/Analytics";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import useAppColorScheme from "#/hooks/useAppColorScheme";

interface ArticleSourceListProperties {
  article_link: string;
}

export const ArticleSourceList = ({
  article_link,
}: ArticleSourceListProperties) => {
  const [links, setLinks] = useState<
    { visitors: number; url: string }[] | undefined
  >();
  const [open, setOpen] = useState(false);
  const colorScheme = useAppColorScheme();
  const textColor = Colors[colorScheme].text;
  const corporate = Colors[colorScheme].corporate;

  useEffect(() => {
    if (article_link && open) {
      getLinks(article_link)
        .then((results) => {
          if (Array.isArray(results) && results.length > 0) setLinks(results);
          else setLinks([]);
        })
        .catch((error) => console.error(error));
    }
  }, [open, article_link]);

  const onPress = async (extension_url: string) => {
    if (extension_url.startsWith("https://")) {
      SourcesStore.onAddSource(extension_url as `https://${string}`, "", "");
    }
    outBoundLinkPress(extension_url, article_link);
  };

  return (
    <Collapsable title="Quellen" defaultOpen={false} onToggle={setOpen}>
      <View>
        {Array.isArray(links) && links.length > 0 ? (
          links
            .filter((l) => (l.visitors ?? 0) > 0)
            .map((link, idx) => (
              <View
                key={idx}
                style={{
                  borderBottomColor: textColor,
                  borderBottomWidth: 1,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 8,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  style={{ width: "80%" }}
                  onPress={() => onPress(link.url)}
                >
                  <Text style={{ color: corporate }}>
                    {link.url.split("?")[0].split("#")[0]}
                  </Text>
                </Pressable>
                <Text style={{ width: "20%" }}>{link.visitors} Clicks</Text>
              </View>
            ))
        ) : (
          <Text>Keine Daten</Text>
        )}
      </View>
    </Collapsable>
  );
};
