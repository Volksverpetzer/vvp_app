import { Zoomable } from "@likashefqet/react-native-image-zoom";
import type { ImageLoadEventData } from "expo-image";
import { Image } from "expo-image";
import React, { useCallback, useMemo, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Animated, ScrollView, TouchableOpacity } from "react-native";

import View from "#/components/design/View";
import { styles } from "#/constants/Styles";

interface InstaPostImageProps {
  photos: string[];
  width: number;
  corporate: string;
  inView?: boolean;
  id: string;
  onPress?: () => void;
  onLongPress: (source: string) => void;
  onFirstLoad?: () => void;
  onPageChange?: () => void;
}

const InstaPostImage = ({
  photos,
  width,
  corporate,
  inView,
  id,
  onPress,
  onLongPress,
  onFirstLoad,
  onPageChange,
}: InstaPostImageProps) => {
  const [ratio, setRatio] = useState(1.33333);
  const [page, setPage] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleLoad = useCallback(
    (event: ImageLoadEventData) => {
      if (loaded) return;
      const { width: w, height: h } = event.source;
      setRatio(Math.round((h / w) * 100) / 100);
      setLoaded(true);
      onFirstLoad?.();
    },
    [loaded, onFirstLoad],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const newPage = Math.round(contentOffsetX / Math.max(width, 1));
      if (page !== newPage) {
        onPageChange?.();
        setPage(newPage);
      }
    },
    [page, width, onPageChange],
  );

  const onScrollEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        listener: handleScroll,
        useNativeDriver: false,
      }),
    [handleScroll, scrollX],
  );

  const imageStyle = useMemo(
    () => ({ width, height: width * ratio }),
    [width, ratio],
  );

  const dots = useMemo(
    () =>
      photos.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={index}
            style={{
              opacity,
              height: 5,
              width: 5,
              backgroundColor: corporate,
              marginHorizontal: 3,
              marginVertical: 10,
              borderRadius: 5,
            }}
          />
        );
      }),
    [photos, scrollX, width, corporate],
  );

  return (
    <View>
      <View style={{ backgroundColor: corporate }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={onScrollEvent}
          scrollEventThrottle={16}
        >
          {photos.map((source, index) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityHint="Gedrückt halten zum Teilen"
              key={index * 163 + id}
              activeOpacity={0.95}
              onPress={onPress}
              onLongPress={() => onLongPress(source)}
            >
              <Zoomable doubleTapScale={2} maxScale={3} minScale={1}>
                <Image
                  onLoad={handleLoad}
                  contentFit="cover"
                  source={
                    page >= index - 1 && inView
                      ? {
                          uri: source,
                          headers: { "Cache-Control": "max-age=604000" },
                        }
                      : undefined
                  }
                  style={imageStyle}
                />
              </Zoomable>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flexDirection: "row", ...styles.centered }}>{dots}</View>
    </View>
  );
};

export default React.memo(InstaPostImage);
