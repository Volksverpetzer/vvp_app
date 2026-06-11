import { Zoomable } from "@likashefqet/react-native-image-zoom";
import type { ImageLoadEventData } from "expo-image";
import { Image } from "expo-image";
import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

import UiPressable from "#/components/ui/UiPressable";
import { globalStyles } from "#/constants/GlobalStyles";

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

const Dot = ({
  index,
  progress,
  color,
}: {
  index: number;
  progress: SharedValue<number>;
  color: string;
}) => {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    ),
  }));
  return (
    <Animated.View
      style={[
        {
          height: 5,
          width: 5,
          backgroundColor: color,
          marginHorizontal: 3,
          marginVertical: 10,
          borderRadius: 5,
        },
        style,
      ]}
    />
  );
};

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
  const progressValue = useSharedValue(0);

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

  // Drives dot opacity on the UI thread during scroll
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        progressValue.value = event.contentOffset.x / Math.max(width, 1);
      },
    },
    [width],
  );

  const handleMomentumScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const newPage = Math.round(
        event.nativeEvent.contentOffset.x / Math.max(width, 1),
      );
      if (page !== newPage) {
        onPageChange?.();
        setPage(newPage);
      }
    },
    [page, width, onPageChange],
  );

  const imageStyle = useMemo(
    () => ({ width, height: width * ratio }),
    [width, ratio],
  );

  return (
    <View>
      <View style={{ backgroundColor: corporate }}>
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        >
          {photos.map((source, index) => (
            <UiPressable
              accessibilityRole="button"
              accessibilityHint="Gedrückt halten zum Teilen"
              key={index * 163 + id}
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
            </UiPressable>
          ))}
        </Animated.ScrollView>
      </View>

      {photos.length > 1 && (
        <View style={[globalStyles.centered, { flexDirection: "row" }]}>
          {photos.map((_, index) => (
            <Dot
              key={index}
              index={index}
              progress={progressValue}
              color={corporate}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default React.memo(InstaPostImage);
