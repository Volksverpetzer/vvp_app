import { Zoomable } from "@likashefqet/react-native-image-zoom";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import NavBar from "#/components/bars/NavBar";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const ImageScreen = () => {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;

  return (
    <View style={[globalStyles.container, { backgroundColor }]}>
      <Zoomable
        style={globalStyles.centered}
        isDoubleTapEnabled
        doubleTapScale={3}
        maxScale={5}
        isPanEnabled
        isPinchEnabled
      >
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
        />
      </Zoomable>
      <NavBar />
    </View>
  );
};

export default ImageScreen;
