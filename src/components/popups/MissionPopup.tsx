import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { SuccessIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface MissionPopupProperties {
  text1: string;
  text2: string;
}

const MissionPopup = ({ text1, text2 }: MissionPopupProperties) => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;
  const corporate = Colors[colorScheme].primary;
  const router = useRouter();
  return (
    <UiPressable
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
          style={{
            paddingLeft: 10,
            color: corporate,
            fontFamily: "SourceSansProBold",
          }}
        >
          {text1}
        </UiText>
      </View>
      <UiText>{text2}</UiText>
    </UiPressable>
  );
};

const missionStyles = StyleSheet.create({
  rectanglePressable: {
    borderRadius: radii.xl,
    flex: 1,
    gap: 10,
    margin: 20,
    padding: 20,
    width: "90%",
  },
});

export default MissionPopup;
