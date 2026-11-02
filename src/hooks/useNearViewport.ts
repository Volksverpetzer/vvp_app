import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";
import type { LayoutChangeEvent, View } from "react-native";

/**
 * The visible window of a scroll view, in its content's coordinates, for
 * content that should only do expensive work (network requests, heavy
 * subtrees) once the reader gets close to it.
 */
export interface ScrollViewport {
  /** The scroll view's content view; element positions are measured against it. */
  contentRef: RefObject<View | null>;
  /** Top edge and height of the visible window. */
  get: () => { top: number; height: number };
  /** Called by the scroll view whenever it scrolls or resizes. */
  update: (top: number, height: number) => void;
  subscribe: (listener: () => void) => () => void;
}

export const createScrollViewport = (
  contentRef: RefObject<View | null>,
  initialHeight: number,
): ScrollViewport => {
  let top = 0;
  let height = initialHeight;
  const listeners = new Set<() => void>();
  return {
    contentRef,
    get: () => ({ top, height }),
    update: (nextTop, nextHeight) => {
      top = nextTop;
      height = nextHeight;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

/** Provided by a scroll view; absent everywhere else. */
export const ScrollViewportContext = createContext<ScrollViewport | null>(null);

/**
 * Whether the element is within `margin` points of the visible window of the
 * surrounding scroll view (see ScrollViewportContext). Latches: once true it
 * stays true. Always true outside such a scroll view.
 *
 * Positions are measured once on layout. Content above that grows later
 * (images loading in) only moves the element further down, so a stale
 * position errs toward loading a little early, never late.
 */
export const useNearViewport = (
  margin: number,
): {
  near: boolean;
  ref: RefObject<View | null>;
  onLayout: (event: LayoutChangeEvent) => void;
} => {
  const viewport = useContext(ScrollViewportContext);
  const [near, setNear] = useState(!viewport);
  const ref = useRef<View>(null);
  const bounds = useRef<{ top: number; bottom: number } | undefined>(undefined);

  const check = useCallback(() => {
    if (!viewport || !bounds.current) return;
    const { top, height } = viewport.get();
    if (
      bounds.current.top < top + height + margin &&
      bounds.current.bottom > top - margin
    ) {
      setNear(true);
    }
  }, [viewport, margin]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const content = viewport?.contentRef.current;
      if (near || !content || !ref.current) return;
      const { height } = event.nativeEvent.layout;
      ref.current.measureLayout(
        content,
        (_x, y) => {
          bounds.current = { top: y, bottom: y + height };
          check();
        },
        // Can't tell where it is — render rather than never.
        () => setNear(true),
      );
    },
    [viewport, near, check],
  );

  useEffect(() => {
    if (near || !viewport) return;
    return viewport.subscribe(check);
  }, [near, viewport, check]);

  return { near, ref, onLayout };
};
