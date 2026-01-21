import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import Colors from "../../constants/Colors";
import { styles } from "../../constants/Styles";
import useColorScheme from "../../hooks/useColorScheme";
import Space from "../design/Space";
import Text from "../design/Text";
import View from "../design/View";

interface MissionPopupProperties {
  text1: string;
  text2: string;
}

const MissionPopup = ({ text1, text2 }: MissionPopupProperties) => {
  const colorScheme = useColorScheme();
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
      style={[
        missionStyles.rectanglePressable,
        { backgroundColor },
        styles.shadow,
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
        <Feather name="check-circle" size={24} color={corporate} />
        <Text style={{ paddingLeft: 10, color: corporate, fontWeight: "bold" }}>
          {text1}
        </Text>
      </View>
      <Space size={10} />
      <Text>{text2}</Text>
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
