import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from "react-native-gesture-handler";
import type { PanGestureActiveEvent } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { CloseIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const ANIMATION_DURATION = 300;
const BACKDROP_OPACITY = 0.7;
// Dragging the sheet down this far (or flinging it this fast) closes it
const SWIPE_CLOSE_DISTANCE = 100;
const SWIPE_CLOSE_VELOCITY = 1000;
// Off-screen start position until the sheet has measured its real height
const HIDDEN_OFFSET = 2000;

interface BottomSheetModalProperties {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Extra styles for the sheet container, e.g. a maxHeight. */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * A bottom-anchored sheet modal: a rounded surface that slides up from the
 * bottom with a drag handle, a title + close-button header, and swipe/backdrop
 * dismissal. Content below the header is provided via children. The bottom
 * padding includes the safe-area inset so content clears the Android nav bar.
 *
 * Swiping works on the handle and header only, so scrollable children keep
 * their own scrolling. Android's back button closes the sheet as well.
 */
const BottomSheetModal = ({
  isVisible,
  onClose,
  title,
  children,
  containerStyle,
}: BottomSheetModalProperties) => {
  const colorScheme = useAppColorScheme();
  const insets = useSafeAreaInsets();
  const corporate = Colors[colorScheme].primary;
  const surface = Colors[colorScheme].surface;
  const textMuted = Colors[colorScheme].textMuted;

  // Stays true through the closing animation, so the sheet can slide out
  // before the native modal goes away
  const [mounted, setMounted] = useState(isVisible);
  const sheetHeight = useSharedValue(HIDDEN_OFFSET);
  const offset = useSharedValue(HIDDEN_OFFSET);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      setMounted(true);
      offset.value = withTiming(0, { duration: ANIMATION_DURATION });
      backdrop.value = withTiming(1, { duration: ANIMATION_DURATION });
    } else {
      backdrop.value = withTiming(0, { duration: ANIMATION_DURATION });
      offset.value = withTiming(
        sheetHeight.value,
        { duration: ANIMATION_DURATION },
        (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        },
      );
    }
  }, [isVisible, offset, backdrop, sheetHeight]);

  const panConfig = useMemo(
    () => ({
      activeOffsetY: [-10, 10] as [number, number],
      onUpdate: (event: PanGestureActiveEvent) => {
        "worklet";
        offset.value = Math.max(0, event.translationY);
      },
      onDeactivate: (event: PanGestureActiveEvent) => {
        "worklet";
        if (
          event.translationY > SWIPE_CLOSE_DISTANCE ||
          event.velocityY > SWIPE_CLOSE_VELOCITY
        ) {
          scheduleOnRN(onClose);
        } else {
          offset.value = withTiming(0, { duration: ANIMATION_DURATION });
        }
      },
    }),
    [offset, onClose],
  );
  const pan = usePanGesture(panConfig);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value * BACKDROP_OPACITY,
  }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      testID="bottom-sheet-modal"
    >
      {/* Gestures inside a Modal need their own root view on Android */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable
            accessible={false}
            importantForAccessibility="no"
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={onClose}
            testID="bottom-sheet-backdrop"
          />
        </Animated.View>
        <Animated.View
          onLayout={(event) => {
            sheetHeight.value = event.nativeEvent.layout.height;
          }}
          style={[
            styles.container,
            // containerStyle sits between the base container style and the
            // safe-area object below: it can override styles.container (e.g.
            // maxHeight), but the trailing object still wins over
            // containerStyle, keeping the safe-area padding/background
            // authoritative.
            containerStyle,
            {
              backgroundColor: surface,
              paddingBottom: spacing.xxl + insets.bottom,
            },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.dragArea}>
              <View style={[styles.handle, { backgroundColor: textMuted }]} />
              <UiSpace size={spacing.lg} />
              <View style={styles.header}>
                <UiText bold size="xl">
                  {title}
                </UiText>
                <UiPressable
                  accessibilityRole="button"
                  accessibilityLabel="Schließen"
                  accessibilityHint="Schließt dieses Fenster"
                  onPress={onClose}
                  hitSlop={8}
                >
                  <CloseIcon size={iconSizes.lg} color={corporate} />
                </UiPressable>
              </View>
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "black",
  },
  container: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  dragArea: {
    backgroundColor: "transparent",
  },
  handle: {
    alignSelf: "center",
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  header: {
    alignItems: "center",
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default BottomSheetModal;
