import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
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
// Dragging a sheet down this far (or flinging it this fast) closes it
export const SWIPE_CLOSE_DISTANCE = 100;
export const SWIPE_CLOSE_VELOCITY = 1000;
// Off-screen start position until the sheet has measured its real height
const HIDDEN_OFFSET = 2000;
// A dialog grows from this scale while it fades in
const DIALOG_START_SCALE = 0.95;

export type UiModalVariant = "sheet" | "dialog";

interface UiModalProperties {
  isVisible: boolean;
  onClose: () => void;
  /**
   * `sheet` slides up from the bottom with a drag handle and closes on a
   * swipe down; `dialog` fades in as a centered card. Defaults to `dialog`.
   */
  variant?: UiModalVariant;
  /** Shown left of the close button in the header. */
  title?: string;
  children: ReactNode;
  /** Extra styles for the card or sheet, e.g. a maxHeight. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Base for the testIDs of the modal and its backdrop. */
  testID?: string;
  /**
   * Called once the modal is fully gone after closing, i.e. when it is safe
   * to present something native on top (like the system share sheet).
   */
  onClosed?: () => void;
}

/**
 * The app's modal: a card or bottom sheet over a dimmed backdrop, with a
 * title + close-button header. Tapping the backdrop, the close button or
 * Android's back button calls onClose; sheets also close on a swipe down
 * (on the handle and header, so scrollable children keep scrolling).
 */
const UiModal = ({
  isVisible,
  onClose,
  variant = "dialog",
  title,
  children,
  containerStyle,
  testID = "ui-modal",
  onClosed,
}: UiModalProperties) => {
  const colorScheme = useAppColorScheme();
  const insets = useSafeAreaInsets();
  const corporate = Colors[colorScheme].primary;
  const surface = Colors[colorScheme].surface;
  const textMuted = Colors[colorScheme].textMuted;
  const isSheet = variant === "sheet";

  // Stays true through the closing animation, so the content can animate
  // out before the native modal goes away
  const [mounted, setMounted] = useState(isVisible);
  // 0 = hidden, 1 = shown; drives the backdrop and the dialog's fade
  const progress = useSharedValue(0);
  // How far the sheet is pushed down from its resting position
  const sheetHeight = useSharedValue(HIDDEN_OFFSET);
  const offset = useSharedValue(HIDDEN_OFFSET);

  // Kept in a ref so a new callback identity doesn't restart the animation
  const onClosedReference = useRef(onClosed);
  onClosedReference.current = onClosed;
  // The closing branch also runs on first render while hidden; only a modal
  // that was actually open may report being closed
  const wasOpen = useRef(false);
  // Bumped on every open and close. Each close hands its number to its own
  // completion callback, which only acts if nothing has happened since: the
  // callback is queued to the JS thread, so it can arrive after a reopen (or
  // a reopen and another close) and must not end that newer transition.
  const transition = useRef(0);
  // The transition whose close has unmounted the modal; iOS's late native
  // dismissal only counts if it still belongs to that close
  const hiddenTransition = useRef(-1);
  // iOS reports the end of the native dismissal via onDismiss (iOS only);
  // everywhere else the modal is gone once it unmounts
  const handleHidden = useCallback((closeTransition: number) => {
    if (closeTransition !== transition.current) return;
    hiddenTransition.current = closeTransition;
    setMounted(false);
    if (Platform.OS !== "ios" && wasOpen.current) {
      wasOpen.current = false;
      onClosedReference.current?.();
    }
  }, []);
  const handleDismiss = () => {
    if (hiddenTransition.current !== transition.current) return;
    wasOpen.current = false;
    onClosedReference.current?.();
  };

  useEffect(() => {
    const currentTransition = ++transition.current;
    if (isVisible) {
      wasOpen.current = true;
      setMounted(true);
      progress.value = withTiming(1, { duration: ANIMATION_DURATION });
      offset.value = withTiming(0, { duration: ANIMATION_DURATION });
    } else {
      offset.value = withTiming(sheetHeight.value, {
        duration: ANIMATION_DURATION,
      });
      progress.value = withTiming(
        0,
        { duration: ANIMATION_DURATION },
        (finished) => {
          if (finished) scheduleOnRN(handleHidden, currentTransition);
        },
      );
    }
  }, [isVisible, progress, offset, sheetHeight, handleHidden]);

  const panConfig = useMemo(
    () => ({
      enabled: isSheet,
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
    [isSheet, offset, onClose],
  );
  const pan = usePanGesture(panConfig);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * BACKDROP_OPACITY,
  }));
  const contentStyle = useAnimatedStyle(() =>
    isSheet
      ? { transform: [{ translateY: offset.value }] }
      : {
          opacity: progress.value,
          transform: [
            {
              scale:
                DIALOG_START_SCALE + (1 - DIALOG_START_SCALE) * progress.value,
            },
          ],
        },
  );

  const header = (
    <View style={styles.header}>
      {title ? (
        <UiText bold size="xl" style={styles.title}>
          {title}
        </UiText>
      ) : (
        <View />
      )}
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
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onDismiss={handleDismiss}
      testID={testID}
    >
      {/* Gestures inside a Modal need their own root view on Android */}
      <GestureHandlerRootView
        style={[styles.root, isSheet ? styles.rootSheet : styles.rootDialog]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable
            accessible={false}
            importantForAccessibility="no"
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={onClose}
            testID={`${testID}-backdrop`}
          />
        </Animated.View>
        <Animated.View
          testID={`${testID}-content`}
          onLayout={(event) => {
            sheetHeight.value = event.nativeEvent.layout.height;
          }}
          style={[
            isSheet ? styles.sheet : styles.dialog,
            // containerStyle can override the base style (e.g. maxHeight),
            // but the trailing object keeps the surface color and the
            // sheet's safe-area padding authoritative
            containerStyle,
            {
              backgroundColor: surface,
              ...(isSheet && { paddingBottom: spacing.xxl + insets.bottom }),
            },
            contentStyle,
          ]}
        >
          {isSheet ? (
            <GestureDetector gesture={pan}>
              <View style={styles.transparent}>
                <View style={[styles.handle, { backgroundColor: textMuted }]} />
                <UiSpace size={spacing.lg} />
                {header}
              </View>
            </GestureDetector>
          ) : (
            header
          )}
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootSheet: {
    justifyContent: "flex-end",
  },
  rootDialog: {
    justifyContent: "center",
    padding: spacing.xl,
  },
  backdrop: {
    backgroundColor: "black",
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  dialog: {
    alignSelf: "center",
    borderRadius: radii.lg,
    // Keeps the card readable on tablets and wide web windows
    maxWidth: 480,
    padding: spacing.xl,
    width: "100%",
  },
  transparent: {
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
    gap: spacing.md,
    justifyContent: "space-between",
  },
  title: {
    flexShrink: 1,
  },
});

export default UiModal;
