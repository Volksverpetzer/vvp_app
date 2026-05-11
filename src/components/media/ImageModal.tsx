import { Zoomable } from "@likashefqet/react-native-image-zoom";
import { Image } from "expo-image";
import { Button, Modal, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import {
  useAppColorScheme,
  useCorporateColor,
} from "#/hooks/useAppColorScheme";

interface ImageModalProperties {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

const ImageModal = ({ uri, visible, onClose }: ImageModalProperties) => {
  const { width } = useWindowDimensions();
  const colorScheme = useAppColorScheme();
  const corporate = useCorporateColor();
  const backgroundColor = Colors[colorScheme].background;

  return (
    <Modal style={styles.centered} visible={visible} onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor }}>
        <Zoomable
          style={{ width, height: "90%", ...styles.centered }}
          isDoubleTapEnabled
          doubleTapScale={3}
          maxScale={5}
          isPanEnabled
          isPinchEnabled
        >
          <Image
            source={{ uri }}
            style={{ width, height: "100%" }}
            contentFit="contain"
          />
        </Zoomable>
      </GestureHandlerRootView>
      <View style={{ padding: 50 }}>
        <Button color={corporate} title="Schließen" onPress={onClose} />
      </View>
    </Modal>
  );
};

export default ImageModal;
