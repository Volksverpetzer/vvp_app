import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, View as RNView } from "react-native";
import Swipeable, {
  SwipeDirection,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import RightAction from "#/components/actions/RightAction";
import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { outBoundLinkPress } from "#/helpers/Linking";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import { HttpsUrl, StoredSources } from "#/types";

const MySources = () => {
  const [sources, setSources] = useState<StoredSources>({});
  const wpUrl = Config.wpUrl;

  const { width } = useFeedDimensions();
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;
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
    <View style={{ flex: 1, backgroundColor: undefined }}>
      {Object.keys(sources)
        .sort((keyA, keyB) => {
          return sources[keyB].date.localeCompare(sources[keyA].date);
        })
        .map((href: HttpsUrl) => {
          const { slug, text } = sources[href];
          return (
            <Swipeable
              key={href}
              rightThreshold={width * 0.6}
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
                  icon={<MaterialIcons name="delete" size={22} color="white" />}
                  label={"Löschen"}
                  hint={"Lösche diese Quelle"}
                  onAction={async () => {
                    await handleDelete(href);
                  }}
                />
              )}
            >
              <RNView
                style={{
                  marginVertical: 15,
                  borderRadius: 10,
                  width,
                  ...styles.shadow,
                  backgroundColor,
                  overflow: "hidden",
                }}
              >
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
              </RNView>
            </Swipeable>
          );
        })}
      <Space size={100} />
      <Text style={{ textAlign: "center", fontSize: 18 }}>
        Klicke auf Links in Artikeln, dann tauchen sie hier auf
      </Text>
      <Space size={100} />
    </View>
  );
};

export default MySources;
