import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { LinkIcon, StarIcon } from "#/components/Icons";
import AnimatedHeader from "#/components/animations/AnimatedHeader";
import View from "#/components/design/View";
import UiTabIconLabel from "#/components/ui/UiTabIconLabel";
import UiTabView from "#/components/ui/UiTabView";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
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
  const backgroundColor = Colors[colorScheme].surface;

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
        outputRange: [17, 0],
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
        <View style={[globalStyles.noBackground, { width: "100%" }]}>
          <UiTabView width={200} style={{ alignSelf: "center" }}>
            <UiTabIconLabel
              icon={(color) => <StarIcon size={24} color={color} />}
              label="Favoriten"
              isActive={activeTab === "favs"}
              onPress={() => setActiveTab("favs")}
              style={{ paddingVertical: 10 }}
              animatedLabelHeight={labelHeight}
              animatedLabelOpacity={labelOpacity}
            />
            <UiTabIconLabel
              icon={(color) => <LinkIcon size={24} color={color} />}
              label="Quellen"
              isActive={activeTab === "sources"}
              onPress={() => setActiveTab("sources")}
              style={{ paddingVertical: 10 }}
              animatedLabelHeight={labelHeight}
              animatedLabelOpacity={labelOpacity}
            />
          </UiTabView>
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
        contentContainerStyle={[
          globalStyles.content,
          { paddingTop: HEADER_HEIGHT },
        ]}
      >
        {activeTab === "favs" ? <MyFavs /> : <MySources />}
      </ScrollView>
    </>
  );
};

export default PersonalTab;
