import { Image } from "expo-image";
import { useCallback, useEffect, useRef } from "react";
import { Animated, Dimensions, Modal } from "react-native";

import Colors from "#/constants/Colors";
import { AppImages } from "#/helpers/AppImages";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const VISIBLE_DURATION_MS = 5000;

// Intrinsic size of einhorn.webp is 600x871
const MASCOT_WIDTH = 220;
const MASCOT_HEIGHT = Math.round(MASCOT_WIDTH * (871 / 600));
// Matches the dome behind the mascot in the report success animation
const CIRCLE_DIAMETER = MASCOT_WIDTH * 1.3;

interface UnicornEasterEggProperties {
  visible: boolean;
  onHide: () => void;
}

/**
 * The Volksverpetzer mascot pops up full-screen for a few seconds when the
 * easter egg on the Settings screen is triggered, then hides itself
 * automatically. Mimikama has no mascot, so this renders nothing there.
 */
const UnicornEasterEgg = (properties: UnicornEasterEggProperties) => {
  const { visible, onHide } = properties;
  const mascot = AppImages.announcementMascot;
  const colorScheme = useAppColorScheme();
  const { height: screenHeight } = Dimensions.get("window");
  const animation = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const translateY = animation.interpolate({
    inputRange: [0, 100],
    outputRange: [screenHeight, screenHeight * 0.4 - MASCOT_HEIGHT / 2],
  });
  const circleScale = animation.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
  });

  const animateOut = useCallback(() => {
    Animated.spring(animation, {
      toValue: 0,
      useNativeDriver: true,
      speed: 10,
    }).start(({ finished }) => {
      if (finished) onHide();
    });
  }, [animation, onHide]);

  useEffect(() => {
    if (!visible || !mascot) return;

    Animated.spring(animation, {
      toValue: 100,
      useNativeDriver: true,
      speed: 8,
    }).start();

    hideTimeoutRef.current = setTimeout(animateOut, VISIBLE_DURATION_MS);

    return () => clearTimeout(hideTimeoutRef.current);
  }, [visible, mascot, animation, animateOut]);

  if (!visible || !mascot) return null;

  return (
    <Modal
      animationType="none"
      navigationBarTranslucent
      statusBarTranslucent
      transparent
      visible
      onRequestClose={() => {}}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          alignItems: "center",
          left: 0,
          position: "absolute",
          right: 0,
          top: 0,
          transform: [{ translateY }],
        }}
      >
        <Animated.View
          style={{
            backgroundColor: Colors[colorScheme].accent,
            borderRadius: CIRCLE_DIAMETER / 2,
            height: CIRCLE_DIAMETER,
            position: "absolute",
            top: (MASCOT_HEIGHT - CIRCLE_DIAMETER) / 2,
            transform: [{ scale: circleScale }],
            width: CIRCLE_DIAMETER,
          }}
        />
        <Image
          source={mascot}
          accessible={false}
          style={{ height: MASCOT_HEIGHT, width: MASCOT_WIDTH }}
        />
      </Animated.View>
    </Modal>
  );
};

export default UnicornEasterEgg;
