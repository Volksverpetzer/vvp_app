import { Zoomable } from "@likashefqet/react-native-image-zoom";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { ErrorIcon } from "#/components/Icons";
import NavBar from "#/components/bars/NavBar";
import UiEmptyState from "#/components/ui/UiEmptyState";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const ImageScreen = () => {
  const { uri } = useLocalSearchParams<{ uri?: string | string[] }>();
  const imageUri = typeof uri === "string" ? uri : undefined;
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {imageUri ? (
        <Zoomable
          style={{ flex: 1, width: "100%" }}
          isDoubleTapEnabled
          doubleTapScale={3}
          maxScale={5}
          isPanEnabled
          isPinchEnabled
        >
          <Image
            source={{ uri: imageUri }}
            style={{ flex: 1, width: "100%" }}
            contentFit="contain"
          />
        </Zoomable>
      ) : (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <UiEmptyState icon={<ErrorIcon />}>
            Bild konnte nicht geladen werden
          </UiEmptyState>
        </View>
      )}
      <NavBar />
    </View>
  );
};

export default ImageScreen;
