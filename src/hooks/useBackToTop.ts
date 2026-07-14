import { useCallback, useRef, useState } from "react";
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

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextVisible = event.nativeEvent.contentOffset.y > showAfter;
      if (nextVisible !== visibleReference.current) {
        visibleReference.current = nextVisible;
        setVisible(nextVisible);
      }
    },
    [showAfter],
  );

  return { visible, onScroll };
};
