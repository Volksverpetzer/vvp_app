import { ImageZoom } from "@likashefqet/react-native-image-zoom";
import { useState } from "react";
import { Button, Modal, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import View from "#/components/design/View";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { onShare as _onShare } from "#/helpers/Sharing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface RedditProperties {
  preview: { images: any; enabled: boolean };
  is_reddit_media_domain: boolean;
  url_overridden_by_dest: string;
  title: string;
  navigation: any;
  created_utc: number;
  permalink: string;
  author: string;
  crosspost_parent_list: any[];
  inView?: boolean;
  thumbnail: string;
}

/**
 * Renders Reddit Post with data from Reddit API (RedditProps)
 */
const RedditPost = (properties: RedditProperties) => {
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const img_dim = properties.preview?.images[0].source ?? {
    width: 100,
    height: 100,
  };
  const height_relation = properties.is_reddit_media_domain
    ? img_dim.height / img_dim.width
    : 0.5125;
  const size = properties.title.length > 100 ? 16 : 18;
  const author =
    properties?.crosspost_parent_list === undefined
      ? properties.author
      : properties.crosspost_parent_list[0].author;
  properties.inView = properties.inView ?? true;

  const datebeautify = () => {
    const date = new Date(properties.created_utc * 1000);
    return (
      date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear()
    );
  };
  const date = datebeautify();

  const onModalClose = () => setIsModalOpen(false);
  const onLayout = (event) => {
    const { height, width } = event.nativeEvent.layout;
    setDims({ width: width, height: height });
  };

  const onShare = async () => {
    try {
      await _onShare(properties.url_overridden_by_dest, {
        location: "RedditPost",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setIsModalOpen(true)}
        onLongPress={onShare}
        onLayout={onLayout}
        activeOpacity={0.8}
      >
        <View>
          <ImageZoom
            style={{
              left: 0,
              width: dims.width,
              height: Math.round(height_relation * dims.width),
            }}
            uri={
              properties.inView
                ? properties.url_overridden_by_dest
                : properties.thumbnail
            }
          />
          <UiText
            style={{
              paddingHorizontal: 30,
              fontSize: size,
              fontWeight: "bold",
              textAlign: "left",
              paddingTop: 20,
            }}
          >
            {properties.title}
          </UiText>
          <UiText
            style={{
              paddingHorizontal: 30,
              fontSize: 16,
              paddingBottom: 10,
              color: "#999",
            }}
          >
            von {author} | {date}
          </UiText>
        </View>
      </TouchableOpacity>
      <Modal style={styles.centered} visible={isModalOpen}>
        <GestureHandlerRootView
          style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}
        >
          <ImageZoom
            style={{ left: 0, width: "100%", height: "80%" }}
            uri={
              properties.inView
                ? properties.url_overridden_by_dest
                : properties.thumbnail
            }
          />
          <View style={{ padding: 70 }}>
            <Button
              color={corporate}
              title="Schließen"
              onPress={onModalClose}
            />
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
};

export default RedditPost;
