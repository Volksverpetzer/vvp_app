import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { LinkIcon, StarIcon } from "#/components/Icons";
import AnimatedHeader from "#/components/animations/AnimatedHeader";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import MyFavs from "#/screens/PersonalTab/components/MyFavs";
import MySources from "#/screens/PersonalTab/components/MySources";

const PersonalTab = () => {
  const [activeTab, setActiveTab] = useState<"favs" | "sources">("favs");
  useFocusEffect(
    useCallback(() => {
      updateBadgeState({ personal: false });
    }, []),
  );

  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const colorScheme = useAppColorScheme();
  const corporateColor = Colors[colorScheme].primary;
  const backgroundColor = Colors[colorScheme].surface;
  const tabIconColor = Colors[colorScheme].iconMuted;
  const textColor = Colors[colorScheme].text;

  const HEADER_HEIGHT = 200;
  const MIN_HEIGHT = 110;

  const labelOpacity = useMemo(
    () =>
      scrollOffsetY.interpolate({
        inputRange: [0, (HEADER_HEIGHT - MIN_HEIGHT) * 0.5],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [scrollOffsetY],
  );

  const labelHeight = useMemo(
    () =>
      scrollOffsetY.interpolate({
        inputRange: [0, (HEADER_HEIGHT - MIN_HEIGHT) * 0.5],
        outputRange: [20, 0],
        extrapolate: "clamp",
      }),
    [scrollOffsetY],
  );

  const toggleHeight = useMemo(
    () =>
      scrollOffsetY.interpolate({
        inputRange: [0, (HEADER_HEIGHT - MIN_HEIGHT) * 0.5],
        outputRange: [60, 40],
        extrapolate: "clamp",
      }),
    [scrollOffsetY],
  );

  return (
    <>
      <AnimatedHeader
        title="Sammlung"
        scrollOffsetY={scrollOffsetY}
        minHeight={110}
        maxHeight={200}
      >
        <View
          style={{
            width: "100%",
            ...styles.noBackground,
          }}
        >
          <Animated.View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              height: toggleHeight,
              width: 200,
              alignSelf: "center",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab("favs")}
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                width: 100,
                backgroundColor:
                  activeTab === "favs" ? corporateColor : tabIconColor,
              }}
            >
              <StarIcon
                size={24}
                color={activeTab === "favs" ? "white" : textColor}
              />
              <Animated.View
                style={{ height: labelHeight, overflow: "hidden" }}
              >
                <Animated.Text
                  style={{
                    alignSelf: "center",
                    marginTop: 2,
                    color: activeTab === "favs" ? "white" : textColor,
                    fontFamily: "SourceSansProBold",
                    fontSize: 12,
                    opacity: labelOpacity,
                  }}
                >
                  Favoriten
                </Animated.Text>
              </Animated.View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab("sources")}
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                width: 100,
                backgroundColor:
                  activeTab === "sources" ? corporateColor : tabIconColor,
              }}
            >
              <LinkIcon
                size={24}
                color={activeTab === "sources" ? "white" : textColor}
              />
              <Animated.View
                style={{ height: labelHeight, overflow: "hidden" }}
              >
                <Animated.Text
                  style={{
                    alignSelf: "center",
                    marginTop: 2,
                    color: activeTab === "sources" ? "white" : textColor,
                    fontFamily: "SourceSansProBold",
                    opacity: labelOpacity,
                  }}
                >
                  Quellen
                </Animated.Text>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
      </AnimatedHeader>
      <ScrollView
        style={{
          flex: 1,
          backgroundColor,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={{
          ...styles.content,
          paddingTop: HEADER_HEIGHT,
        }}
      >
        {activeTab === "favs" ? <MyFavs /> : <MySources />}
      </ScrollView>
    </>
  );
};

export default PersonalTab;
