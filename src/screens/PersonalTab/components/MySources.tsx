import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { FC, useCallback, useState } from "react";
import { Pressable, Text as RNText, View as RNView } from "react-native";
import Swipeable, {
  SwipeDirection,
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import Space from "#/components/design/Space";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { outBoundLinkPress } from "#/helpers/Linking";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import useColorScheme, { useCorporateColor } from "#/hooks/useColorScheme";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import { StoredSources } from "#/types";

const MySources = () => {
  const [sources, setSources] = useState<StoredSources>({});
  const wpUrl = Config.wpUrl;

  const { width } = useFeedDimensions();
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme].background;
  const corporate = useCorporateColor();
  useFocusEffect(
    useCallback(() => {
      SourcesStore.getAllSources().then(setSources);
    }, []),
  );

  const handleDelete = useCallback(async (href: `https://${string}`) => {
    await SourcesStore.removeSource(href);
    setSources((prev) => {
      const updated = { ...prev };
      delete (updated as any)[href];
      return updated;
    });
  }, []);

  const RightActions: FC<{
    progress: SharedValue<number>;
    drag: SharedValue<number>;
    swipeable: SwipeableMethods;
    href: `https://${string}`;
  }> = ({ drag, swipeable, href }) => {
    const actionStyle = useAnimatedStyle(() => {
      "worklet";
      const translateX = interpolate(
        drag.value,
        [-120, 0],
        [0, 120],
        Extrapolation.CLAMP,
      );
      const opacity = interpolate(
        drag.value,
        [-120, -60, 0],
        [1, 1, 0],
        Extrapolation.CLAMP,
      );
      return { transform: [{ translateX }], opacity };
    });
    return (
      <RNView style={{ justifyContent: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quelle löschen"
          accessibilityHint="Löscht diese Quelle"
          onPress={async () => {
            await handleDelete(href);
            swipeable.close();
          }}
        >
          <Animated.View
            style={[
              {
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: Colors[colorScheme].highlight,
                paddingHorizontal: 20,
                height: "100%",
              },
              actionStyle,
            ]}
          >
            <MaterialIcons name="delete" size={22} color={"white"} />
            <RNText
              style={{ ...styles.whiteText, fontWeight: "bold", marginTop: 6 }}
            >
              Löschen
            </RNText>
          </Animated.View>
        </Pressable>
      </RNView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: undefined }}>
      {Object.keys(sources)
        .sort((keyA, keyB) => {
          return sources[keyB].date.localeCompare(sources[keyA].date);
        })
        .map((href) => {
          const { slug, text } = sources[href];
          return (
            <Swipeable
              key={href}
              rightThreshold={width * 0.6}
              onSwipeableOpen={(direction) => {
                if (direction === SwipeDirection.LEFT) {
                  handleDelete(href as `https://${string}`);
                }
              }}
              renderRightActions={(p, d, s) => (
                <RightActions
                  progress={p}
                  drag={d}
                  swipeable={s}
                  href={href as `https://${string}`}
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
                  onPress={() =>
                    outBoundLinkPress(
                      href as `https://${string}`,
                      wpUrl + "/" + slug,
                    )
                  }
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
