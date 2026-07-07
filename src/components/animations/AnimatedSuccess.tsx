import { BlurView } from "expo-blur";
import { useCallback, useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet } from "react-native";
import type { ImageSourcePropType, ImageStyle, StyleProp } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

import Success from "#assets/images/success.png";

interface AnimatedSuccessProperties {
  animated: boolean;
  title?: string;
  subtitle?: string;
  image?: ImageSourcePropType;
  imageStyle?: StyleProp<ImageStyle>;
}

const AnimatedSuccess = (properties: AnimatedSuccessProperties) => {
  const {
    animated,
    title = "Danke",
    subtitle = "Du hast einen wichtigen Beitrag geleistet!",
    image = Success,
    imageStyle,
  } = properties;
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const animation = useRef(new Animated.Value(0)).current;
  const colorScheme = useAppColorScheme();
  // The dome is a circle grown around its center; keep it small enough that
  // the image can sit on top of it, mostly outside the background
  const domeDiameter = Math.min(screenWidth * 1.2, screenHeight * 0.6);
  const domeCenterY = screenHeight * 0.95;
  const domeTop = domeCenterY - domeDiameter / 2;
  const imageHeight =
    (StyleSheet.flatten(imageStyle)?.height as number | undefined) ?? 200;
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
    outputRange: [0, -screenHeight * 0.55],
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

  if (!animated) return;

  const imageWidth =
    (StyleSheet.flatten(imageStyle)?.width as number | undefined) ?? 200;

  return (
    <>
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
        <BlurView
          intensity={40}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
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
            padding: 20,
            position: "absolute",
            top: screenHeight * 1.33,
            zIndex: 9999,
          },
          {
            transform: [{ translateY: textPosition }],
          },
        ]}
      >
        <UiText style={{ color: "#fff", fontSize: 50 }}>{title}</UiText>
        <UiText style={{ color: "#fff", fontSize: 20 }}>{subtitle}</UiText>
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
    </>
  );
};

export default AnimatedSuccess;
