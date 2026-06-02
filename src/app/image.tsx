import { Zoomable } from "@likashefqet/react-native-image-zoom";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import NavBar from "#/components/bars/NavBar";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const ImageScreen = () => {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Zoomable
        style={{ flex: 1, width: "100%" }}
        isDoubleTapEnabled
        doubleTapScale={3}
        maxScale={5}
        isPanEnabled
        isPinchEnabled
      >
        <Image
          source={{ uri }}
          style={{ flex: 1, width: "100%" }}
          contentFit="contain"
        />
      </Zoomable>
      <NavBar />
    </View>
  );
};

export default ImageScreen;
