import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Swipeable, {
  SwipeDirection,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import { DeleteIcon, LinkIcon } from "#/components/Icons";
import RightAction from "#/components/actions/RightAction";
import Card from "#/components/design/Card";
import Space from "#/components/design/Space";
import Heading from "#/components/typography/Heading";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { outBoundLinkPress } from "#/helpers/Linking";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl, StoredSources } from "#/types";

type SourceEntry = { href: HttpsUrl; text?: string; date?: string };
type SlugGroup = { slug: string; latestDate: string; entries: SourceEntry[] };

const MySources = () => {
  const [sources, setSources] = useState<StoredSources>({});
  const wpUrl = Config.wpUrl;

  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  useFocusEffect(
    useCallback(() => {
      SourcesStore.getAllSources().then(setSources);
    }, []),
  );

  const handleDelete = useCallback(async (href: HttpsUrl) => {
    await SourcesStore.removeSource(href);
    setSources((prev) => {
      const { [href]: _removed, ...rest } = prev;
      return rest as StoredSources;
    });
  }, []);

  const slugGroups = useMemo<SlugGroup[]>(() => {
    const groupMap: Record<string, SlugGroup> = {};
    for (const [href, source] of Object.entries(sources)) {
      const { slug, text, date } = source;
      if (!groupMap[slug]) {
        groupMap[slug] = { slug, latestDate: date ?? "", entries: [] };
      }
      const group = groupMap[slug];
      group.entries.push({ href: href as HttpsUrl, text, date });
      if ((date ?? "") > group.latestDate) {
        group.latestDate = date ?? "";
      }
    }
    return Object.values(groupMap)
      .sort((a, b) => b.latestDate.localeCompare(a.latestDate))
      .map((group) => ({
        ...group,
        entries: group.entries.sort((a, b) =>
          (b.date ?? "").localeCompare(a.date ?? ""),
        ),
      }));
  }, [sources]);

  return (
    <View style={{ flex: 1, gap: 20 }}>
      {slugGroups.map((group) => {
        const title = group.entries.find((e) => e.text)?.text;
        return (
          <Card key={group.slug} style={{ padding: 0 }}>
            <View style={{ padding: 30, gap: 10 }}>
              {title && (
                <Heading style={{ color: Colors[colorScheme].text }}>
                  {title}
                </Heading>
              )}
              {group.entries.map((entry) => (
                <Swipeable
                  key={entry.href}
                  testID={`source-row-${entry.href}`}
                  onSwipeableOpen={async (direction) => {
                    if (direction === SwipeDirection.LEFT) {
                      await handleDelete(entry.href);
                    }
                  }}
                  renderRightActions={(p, d, s) => (
                    <RightAction
                      progress={p}
                      drag={d}
                      swipeable={s}
                      icon={<DeleteIcon size={24} color="white" />}
                      label="Löschen"
                      hint="Lösche diese Quelle"
                      onAction={async () => {
                        await handleDelete(entry.href);
                      }}
                    />
                  )}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      outBoundLinkPress(entry.href, wpUrl + "/" + group.slug)
                    }
                  >
                    <UiText style={{ color: corporate }}>{entry.href}</UiText>
                  </Pressable>
                </Swipeable>
              ))}
            </View>
          </Card>
        );
      })}
      <Space size={50} />
      <View style={{ ...styles.centered }}>
        <LinkIcon color={corporate} />
        <UiText style={{ textAlign: "center", fontSize: 18 }}>
          Klicke auf Links in Artikeln, dann tauchen sie hier auf
        </UiText>
      </View>
      <Space size={100} />
    </View>
  );
};

export default MySources;
