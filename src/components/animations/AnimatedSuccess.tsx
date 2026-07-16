import { Asset } from "expo-asset";
import { BlurView } from "expo-blur";
import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { Animated, Dimensions, Modal, StyleSheet } from "react-native";
import type {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  View,
} from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { AppImages } from "#/helpers/AppImages";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

import Success from "#assets/images/success.png";

// Display size of the mascot (intrinsic 600x871, scaled down)
const MASCOT_IMAGE_STYLE = { height: 261, width: 180 } as const;

interface AnimatedSuccessProperties {
  animated: boolean;
  title?: string;
  subtitle?: string;
  image?: ImageSourcePropType;
  imageStyle?: StyleProp<ImageStyle>;
  /**
   * Ref to a BlurTargetView wrapping the screen content behind the
   * animation. When given, Android 12+ renders a real blur; without it
   * (or on older Androids) Android falls back to a translucent tint.
   */
  blurTargetRef?: RefObject<View | null>;
}

const AnimatedSuccess = (properties: AnimatedSuccessProperties) => {
  const {
    animated,
    title = "Danke",
    subtitle = "Du hast einen wichtigen Beitrag geleistet!",
    // The variant mascot by default; Mimikama has none and falls back
    // to the classic success icon
    image = AppImages.successMascot ?? Success,
    imageStyle = image === AppImages.successMascot
      ? MASCOT_IMAGE_STYLE
      : undefined,
    blurTargetRef,
  } = properties;
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const animation = useRef(new Animated.Value(0)).current;
  const colorScheme = useAppColorScheme();
  // The dome is a circle grown around its center; keep it small enough that
  // the image can sit on top of it, mostly outside the background
  const domeDiameter = Math.min(screenWidth * 1.4, screenHeight * 0.8);
  const domeCenterY = screenHeight * 0.9;
  const domeTop = domeCenterY - domeDiameter / 2;
  // Prefer explicit dimensions from imageStyle; otherwise fall back to the
  // asset's intrinsic size so the image is positioned correctly for callers
  // that don't pass a style (e.g. the donation flow's default icon)
  const flattenedImageStyle = StyleSheet.flatten(imageStyle);
  // Image.resolveAssetSource doesn't exist on react-native-web; expo-asset
  // resolves module IDs on all platforms, and object sources carry their
  // own optional width/height
  const resolvedAsset =
    typeof image === "number"
      ? Asset.fromModule(image)
      : Array.isArray(image)
        ? undefined
        : image;
  const imageHeight =
    typeof flattenedImageStyle?.height === "number"
      ? flattenedImageStyle.height
      : (resolvedAsset?.height ?? 200);
  const imageWidth =
    typeof flattenedImageStyle?.width === "number"
      ? flattenedImageStyle.width
      : (resolvedAsset?.width ?? 200);
  const radius = animation.interpolate({
    inputRange: [0, 100],
    outputRange: [0, domeDiameter],
  });
  const blurOpacity = animation.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
  });
  const textPosition = animation.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -screenHeight * 0.7],
  });

  const spinAnimation = useRef(new Animated.Value(0)).current;
  const opacity = spinAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
  });
  const spin = spinAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ["-70deg", "0deg"],
  });

  const cleanUpSubmit = useCallback(() => {
    Animated.parallel([
      Animated.spring(animation, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
      }),
      Animated.spring(spinAnimation, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
      }),
    ]).start();
  }, [animation, spinAnimation]);

  const animate = useCallback(() => {
    Animated.parallel([
      Animated.spring(animation, {
        toValue: 100,
        useNativeDriver: true,
        speed: 6,
      }),
      Animated.spring(spinAnimation, {
        toValue: 100,
        useNativeDriver: true,
        speed: 1,
      }),
    ]).start();
  }, [animation, spinAnimation]);

  useEffect(() => {
    if (animated) {
      animate();
      return;
    }

    cleanUpSubmit();
  }, [animated, animate, cleanUpSubmit]);

  if (!animated) return null;

  return (
    // A transparent modal escapes any parent clipping (the donation card
    // renders this deep inside a scroll view), covering the whole screen
    <Modal
      animationType="none"
      navigationBarTranslucent
      statusBarTranslucent
      transparent
      visible
      // Android back button: the overlay dismisses itself after a few
      // seconds; deliberately not cancellable
      onRequestClose={() => {}}
    >
      {/* Blur the form behind the animation (opacity fade, since the blur
          intensity itself cannot be animated natively) */}
      <Animated.View
        pointerEvents="none"
        style={{
          bottom: 0,
          left: 0,
          opacity: blurOpacity,
          position: "absolute",
          right: 0,
          top: 0,
          zIndex: 998,
        }}
      >
        {/* Real blur on iOS always; on Android only when a blur target
            is provided and the device runs Android 12+, otherwise a
            translucent dark tint */}
        <BlurView
          intensity={40}
          tint="dark"
          blurMethod={blurTargetRef ? "dimezisBlurViewSdk31Plus" : "none"}
          blurTarget={blurTargetRef}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            backgroundColor: Colors[colorScheme].accent,
            borderRadius: 10,
            position: "absolute",
            left: screenWidth / 2,
            top: domeCenterY,
            width: 1,
            height: 1,
            zIndex: 999,
          },
          {
            transform: [{ scale: radius }],
          },
        ]}
      ></Animated.View>
      <Animated.View
        style={[
          {
            alignItems: "center",
            left: 0,
            padding: 20,
            position: "absolute",
            right: 0,
            top: screenHeight * 1.33,
            zIndex: 9999,
          },
          {
            transform: [{ translateY: textPosition }],
          },
        ]}
      >
        <UiText style={{ color: "#fff", fontSize: 50, textAlign: "center" }}>
          {title}
        </UiText>
        <UiText size="xl" style={{ color: "#fff", textAlign: "center" }}>
          {subtitle}
        </UiText>
      </Animated.View>
      {/* Sits on top of the dome, mostly outside the background */}
      <Animated.Image
        style={[
          {
            opacity: opacity,
            position: "absolute",
            top: domeTop - imageHeight * 0.8,
            left: (screenWidth - imageWidth) / 2,
            zIndex: 9999,
          },
          {
            transform: [{ rotate: spin }],
          },
          imageStyle,
        ]}
        source={image}
      />
    </Modal>
  );
};

export default AnimatedSuccess;
