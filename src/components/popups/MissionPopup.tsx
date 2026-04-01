import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { SuccessIcon } from "#/components/Icons";
import Space from "#/components/design/Space";
import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface MissionPopupProperties {
  text1: string;
  text2: string;
}

const MissionPopup = ({ text1, text2 }: MissionPopupProperties) => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;
  const corporate = Colors[colorScheme].corporate;
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      testID="mission-popup"
      onPress={() => {
        if (router.canGoBack()) {
          router.dismissTo("/(tabs)/action");
        } else {
          router.replace("/(tabs)/action");
        }
      }}
      style={[missionStyles.rectanglePressable, { backgroundColor }]}
    >
      <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
        <SuccessIcon size={24} color={corporate} />
        <UiText
          style={{ paddingLeft: 10, color: corporate, fontWeight: "bold" }}
        >
          {text1}
        </UiText>
      </View>
      <Space size={10} />
      <UiText>{text2}</UiText>
    </Pressable>
  );
};

const missionStyles = StyleSheet.create({
  rectanglePressable: {
    borderRadius: 20,
    flex: 1,
    margin: 20,
    padding: 20,
    width: "90%",
  },
});

export default MissionPopup;
