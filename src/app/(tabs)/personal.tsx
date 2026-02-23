import { useFocusEffect } from "expo-router";
import { JSX, useCallback, useState } from "react";
import { Animated, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { LinkIcon, StarIcon } from "#/components/Icons";
import AnimatedHeader from "#/components/animations/AnimatedHeader";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import MyFavs from "#/screens/PersonalTab/components/MyFavs";
import MySources from "#/screens/PersonalTab/components/MySources";

const PersonalTab = () => {
  const tabs: Record<string, JSX.Element> = {
    sources: MySources(),
    favs: MyFavs(),
  };
  const [activeTab, setActiveTab] = useState<keyof typeof tabs>("favs");
  useFocusEffect(
    useCallback(() => {
      updateBadgeState({ personal: false });
    }, []),
  );

  const scrollOffsetY = new Animated.Value(0);
  const colorScheme = useAppColorScheme();
  const corporateColor = Colors[colorScheme].corporate;
  const backgroundColor = Colors[colorScheme].secondaryBackground;
  const tabIconColor = Colors[colorScheme].tabIconDefault;

  const HEADER_HEIGHT = 200;

  return (
    <>
      <AnimatedHeader
        title="Sammlung"
        scrollOffsetY={scrollOffsetY}
        minHeight={80}
        maxHeight={200}
        headerComponent={
          <View
            style={{
              width: "100%",
              ...styles.noBackground,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                height: 60,
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
                <StarIcon color={"white"} />
                <Text
                  style={{
                    alignSelf: "center",
                    marginTop: 0,
                    ...styles.whiteText,
                    fontFamily: "SourceSansProBold",
                  }}
                >
                  Favoriten
                </Text>
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
                <LinkIcon color={"white"} />
                <Text
                  style={{
                    alignSelf: "center",
                    marginTop: 0,
                    ...styles.whiteText,
                    fontFamily: "SourceSansProBold",
                  }}
                >
                  Quellen
                </Text>
              </Pressable>
            </View>
          </View>
        }
      />
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
          ...styles.feed,
          paddingTop: HEADER_HEIGHT,
        }}
      >
        {tabs[activeTab]}
      </ScrollView>
    </>
  );
};

export default PersonalTab;
