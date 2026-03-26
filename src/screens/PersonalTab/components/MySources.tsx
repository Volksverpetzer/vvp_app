import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import Swipeable, {
  SwipeDirection,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import { DeleteIcon, LinkIcon } from "#/components/Icons";
import RightAction from "#/components/actions/RightAction";
import Card from "#/components/design/Card";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { outBoundLinkPress } from "#/helpers/Linking";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl, StoredSources } from "#/types";

const MySources = () => {
  const [sources, setSources] = useState<StoredSources>({});
  const wpUrl = Config.wpUrl;

  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].corporate;
  useFocusEffect(
    useCallback(() => {
      SourcesStore.getAllSources().then(setSources);
    }, []),
  );

  const handleDelete = useCallback(async (href: HttpsUrl) => {
    await SourcesStore.removeSource(href);
    setSources((prev) => {
      const updated = { ...prev };
      delete (updated as any)[href];
      return updated;
    });
  }, []);

  return (
    <View style={{ flex: 1, gap: 20, backgroundColor: undefined }}>
      {Object.keys(sources)
        .sort((keyA, keyB) => {
          return sources[keyB].date.localeCompare(sources[keyA].date);
        })
        .map((href: HttpsUrl) => {
          const { slug, text } = sources[href];
          return (
            <Swipeable
              key={href}
              onSwipeableOpen={async (direction) => {
                if (direction === SwipeDirection.LEFT) {
                  await handleDelete(href);
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
                    await handleDelete(href);
                  }}
                />
              )}
            >
              <Card style={{ padding: 0 }}>
                <Pressable
                  accessibilityRole="button"
                  style={{ padding: 30 }}
                  onPress={() => outBoundLinkPress(href, wpUrl + "/" + slug)}
                >
                  {text && (
                    <Text
                      style={{
                        ...styles.heading,
                        padding: 0,
                        paddingBottom: 10,
                      }}
                    >
                      {text}
                    </Text>
                  )}
                  <Text style={{ color: corporate }}>{href}</Text>
                </Pressable>
              </Card>
            </Swipeable>
          );
        })}
      <Space size={50} />
      <View style={{ ...styles.centered }}>
        <LinkIcon color={corporate} />
        <Text style={{ textAlign: "center", fontSize: 18 }}>
          Klicke auf Links in Artikeln, dann tauchen sie hier auf
        </Text>
      </View>
      <Space size={100} />
    </View>
  );
};

export default MySources;
