import { useCallback, useEffect, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useWindowDimensions } from "react-native";

/**
 * Tracks scroll position for a BackToTopButton. The button becomes visible
 * once the user has scrolled more than `threshold` pixels down (defaults to
 * one window height).
 *
 * Pass the returned `onScroll` to the scroll container (or call it from an
 * existing scroll listener) and feed `visible` into the BackToTopButton.
 */
export const useBackToTop = (threshold?: number) => {
  const windowHeight = useWindowDimensions().height;
  const showAfter = threshold ?? windowHeight;
  const [visible, setVisible] = useState(false);
  // Scroll events fire ~60x/s; only touch state when visibility actually flips.
  const visibleReference = useRef(false);
  const lastOffsetY = useRef(0);

  const updateVisible = useCallback(
    (offsetY: number) => {
      lastOffsetY.current = offsetY;
      const nextVisible = offsetY > showAfter;
      if (nextVisible !== visibleReference.current) {
        visibleReference.current = nextVisible;
        setVisible(nextVisible);
      }
    },
    [showAfter],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateVisible(event.nativeEvent.contentOffset.y);
    },
    [updateVisible],
  );

  // Re-evaluate when the threshold changes (e.g. device rotation) so the
  // button doesn't stay stale until the next scroll event.
  useEffect(() => {
    updateVisible(lastOffsetY.current);
  }, [updateVisible]);

  return { visible, onScroll };
};
