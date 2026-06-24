import { useEffect, useState } from "react";
import { View } from "react-native";

import UiCollapsable from "#/components/ui/UiCollapsable";
import UiPressable from "#/components/ui/UiPressable";
import UiSpinner from "#/components/ui/UiSpinner";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { outBoundLinkPress } from "#/helpers/Linking";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { getLinks } from "#/helpers/network/Engagement";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

interface ArticleSourceListProperties {
  article_link: HttpsUrl;
  article_title?: string;
  slug: string;
}

export const ArticleSourceList = ({
  article_link,
  article_title,
  slug,
}: ArticleSourceListProperties) => {
  const [links, setLinks] = useState<
    { visitors: number; url: HttpsUrl }[] | undefined
  >();
  const [open, setOpen] = useState(false);
  const colorScheme = useAppColorScheme();
  const textColor = Colors[colorScheme].text;
  const corporate = Colors[colorScheme].primary;

  useEffect(() => {
    if (!Config.enableEngagement) {
      setLinks([]);
      return;
    }

    if (article_link && open) {
      getLinks(article_link)
        .then((results) => {
          if (Array.isArray(results) && results.length > 0) setLinks(results);
          else setLinks([]);
        })
        .catch((error) => {
          console.error(error);
          setLinks([]);
        });
    }
  }, [open, article_link]);

  const onPress = async (extension_url: HttpsUrl) => {
    if (Config.enableEngagement) {
      await SourcesStore.onAddSource(extension_url, slug, article_title);
    }
    outBoundLinkPress(extension_url, article_link);
  };

  const visibleLinks = Array.isArray(links)
    ? links.filter((l) => (l.visitors ?? 0) > 0)
    : [];

  return (
    <UiCollapsable
      title="Quellen"
      defaultOpen={false}
      onToggle={setOpen}
      cardBackground={Colors[colorScheme].surface}
    >
      <View>
        {links === undefined ? (
          <UiSpinner size="small" containerStyle={{ paddingVertical: 8 }} />
        ) : visibleLinks.length > 0 ? (
          visibleLinks.map((link, idx) => (
            <View
              key={`${link.url}-${idx}`}
              style={{
                borderBottomColor: textColor,
                borderBottomWidth: idx < visibleLinks.length - 1 ? 1 : 0,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
              }}
            >
              <UiPressable
                accessibilityRole="button"
                style={{ width: "80%" }}
                onPress={() => onPress(link.url)}
              >
                <UiText style={{ color: corporate }}>
                  {link.url.split("?")[0].split("#")[0]}
                </UiText>
              </UiPressable>
              <UiText style={{ width: "20%" }}>{link.visitors} Clicks</UiText>
            </View>
          ))
        ) : (
          <UiText>Keine Daten</UiText>
        )}
      </View>
    </UiCollapsable>
  );
};
