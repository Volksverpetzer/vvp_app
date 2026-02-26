import { useCallback, useEffect, useRef } from "react";
import { Animated, Dimensions } from "react-native";

import Text from "#/components/design/Text";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

import Success from "#assets/images/success.png";

interface AnimatedSuccessProperties {
  animated: boolean;
}

const AnimatedSuccess = (properties: AnimatedSuccessProperties) => {
  const { animated } = properties;
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const animation = useRef(new Animated.Value(0)).current;
  const colorScheme = useAppColorScheme();
  const radius = animation.interpolate({
    inputRange: [0, 100],
    outputRange: [0, screenWidth * 2],
  });
  const textPosition = animation.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -screenHeight * 0.8],
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
    ]).start(cleanUpSubmit);
  }, [animation, cleanUpSubmit, spinAnimation]);

  useEffect(() => {
    if (animated) animate();
  }, [animated, animate]);

  if (!animated) return;

  return (
    <>
      <Animated.View
        style={[
          {
            backgroundColor: Colors[colorScheme].highlight,
            borderRadius: 10,
            position: "absolute",
            left: screenWidth / 2,
            top: screenHeight * 0.75,
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
        <Text style={{ color: "#fff", fontSize: 50 }}>Danke</Text>
        <Text style={{ color: "#fff", fontSize: 20 }}>
          Du hast einen wichtigen Beitrag geleistet!
        </Text>
      </Animated.View>
      <Animated.Image
        style={[
          {
            opacity: opacity,
            position: "absolute",
            top: screenHeight * 0.3,
            left: screenWidth / 4,
            zIndex: 9999,
          },
          {
            transform: [{ rotate: spin }, { scale: 0.75 }],
          },
        ]}
        source={Success}
      />
    </>
  );
};

export default AnimatedSuccess;
