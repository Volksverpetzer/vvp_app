import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Animated, Dimensions, Modal, View } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { spacing } from "#/constants/Spacing";
import { AppImages } from "#/helpers/AppImages";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const VISIBLE_DURATION_MS = 5000;

// Intrinsic size of einhorn.webp is 524x833
const MASCOT_WIDTH = 170;
const MASCOT_HEIGHT = Math.round(MASCOT_WIDTH * (833 / 524));

interface UnicornEasterEggProperties {
  visible: boolean;
  onHide: () => void;
  /** Optional caption shown below the mascot, e.g. a level-complete cheer. */
  message?: string;
}

/**
 * The Volksverpetzer mascot pops up full-screen for a few seconds — used for
 * the Settings-screen easter egg as well as celebrating milestones like a
 * completed game level — then hides itself automatically. Mimikama has no
 * mascot, so this renders nothing there.
 */
const UnicornEasterEgg = (properties: UnicornEasterEggProperties) => {
  const { visible, onHide, message } = properties;
  const mascot = AppImages.announcementMascot;
  const colorScheme = useAppColorScheme();
  const { height: screenHeight } = Dimensions.get("window");
  const animation = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // Keep the latest onHide in a ref so a parent re-render (which recreates
  // the callback) can't restart the effect below and reset the dismiss timer
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  // Measured from the actual mascot+message block (rather than assumed from
  // a guessed message height) so the circle always ends up truly centered
  // on its content, regardless of how many lines the message wraps to.
  // Starts unmeasured (rather than defaulting to the mascot-only height) so
  // the entrance animation — which depends on this value — never starts
  // with a wrong height and visibly snaps once the real layout lands.
  const [contentHeight, setContentHeight] = useState<number>();
  const hasMeasured = contentHeight !== undefined;
  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.height);
  }, []);

  // The circle encloses the mascot alone, or the mascot plus the message
  // caption below it — sized off each case's own diagonal, with a bit of
  // margin, matching the dome behind the mascot in the report success
  // animation.
  const measuredHeight = contentHeight ?? MASCOT_HEIGHT;
  const circleDiameter = Math.hypot(MASCOT_WIDTH, measuredHeight) * 1.1;

  const translateY = animation.interpolate({
    inputRange: [0, 100],
    outputRange: [screenHeight, screenHeight * 0.4 - measuredHeight / 2],
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
      if (finished) onHideRef.current();
    });
  }, [animation]);

  // Auto-dismiss is on a wall-clock timer independent of measurement, so a
  // popup still hides itself on schedule even in the (real-world
  // impossible, but test-rig-relevant) case onLayout never fires.
  useEffect(() => {
    if (!visible || !mascot) return;

    hideTimeoutRef.current = setTimeout(animateOut, VISIBLE_DURATION_MS);

    return () => clearTimeout(hideTimeoutRef.current);
  }, [visible, mascot, animateOut]);

  useEffect(() => {
    // Wait for the real onLayout measurement before animating in, so the
    // circle/position never start from the mascot-only fallback height and
    // then jump once the true content height is known.
    if (!visible || !mascot || !hasMeasured) return;

    Animated.spring(animation, {
      toValue: 100,
      useNativeDriver: true,
      speed: 8,
    }).start();
  }, [visible, mascot, hasMeasured, animation]);

  if (!visible || !mascot) return null;

  return (
    <Modal
      testID="unicorn-easter-egg-modal"
      animationType="none"
      navigationBarTranslucent
      statusBarTranslucent
      transparent
      visible
      onRequestClose={animateOut}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          alignItems: "center",
          left: 0,
          opacity: hasMeasured ? 1 : 0,
          position: "absolute",
          right: 0,
          top: 0,
          transform: [{ translateY }],
        }}
      >
        <Animated.View
          testID="unicorn-easter-egg-circle"
          style={{
            backgroundColor: Colors[colorScheme].accent,
            borderRadius: circleDiameter / 2,
            height: circleDiameter,
            position: "absolute",
            top: (measuredHeight - circleDiameter) / 2,
            transform: [{ scale: circleScale }],
            width: circleDiameter,
          }}
        />
        <View
          testID="unicorn-easter-egg-content"
          onLayout={handleContentLayout}
          style={{ alignItems: "center" }}
        >
          <Image
            source={mascot}
            accessible={false}
            style={{ height: MASCOT_HEIGHT, width: MASCOT_WIDTH }}
          />
          {message && (
            <UiText
              size="lg"
              bold
              style={{
                color: Colors[colorScheme].onPrimary,
                marginTop: spacing.md,
                paddingBottom: spacing.xl,
                paddingHorizontal: spacing.xl,
                textAlign: "center",
              }}
            >
              {message}
            </UiText>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

export default UnicornEasterEgg;
