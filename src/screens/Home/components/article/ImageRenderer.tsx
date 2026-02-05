import { Zoomable } from "@likashefqet/react-native-image-zoom";
import { Image, ImageLoadEventData } from "expo-image";
import { useState } from "react";
import { Button, Modal, Pressable, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  InternalRendererProps,
  TBlock,
  useInternalRenderer,
} from "react-native-render-html";

import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import useAppColorScheme from "#/hooks/useAppColorScheme";

const ImageRenderer = (properties: InternalRendererProps<TBlock>) => {
  const [ratio, setRatio] = useState(1.5);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { rendererProps } = useInternalRenderer("img", properties);
  const { width } = useWindowDimensions();
  const colorScheme = useAppColorScheme();
  const uri = rendererProps.source.uri;
  const backgroundColor = Colors[colorScheme].background;

  const onLoad = (event: ImageLoadEventData) => {
    if (isLoaded) return;
    setIsLoaded(true);
    const { width, height } = event.source;
    const _ratio = Math.round((height / width) * 100) / 100;
    if (ratio !== _ratio) {
      setRatio(_ratio);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      style={styles.centered}
      onPress={() => setIsModalOpen(true)}
    >
      <Image
        onLoad={onLoad}
        source={{ uri }}
        style={{ width, height: width * ratio, backgroundColor }}
      />

      <Modal
        style={styles.centered}
        visible={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <GestureHandlerRootView
          style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}
        >
          <Zoomable
            style={{ width, height: "90%", ...styles.centered }}
            isDoubleTapEnabled
            doubleTapScale={3}
            maxScale={5}
            isPanEnabled
            isPinchEnabled
          >
            <Image source={{ uri }} style={{ width, height: width * ratio }} />
          </Zoomable>
        </GestureHandlerRootView>
        <View style={{ padding: 50 }}>
          <Button title="Schließen" onPress={() => setIsModalOpen(false)} />
        </View>
      </Modal>
    </Pressable>
  );
};

export default ImageRenderer;
