import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import BadgeStore from "#/helpers/Stores/BadgeStore";

export interface BadgeState {
  action: boolean;
  personal: boolean;
  contact: boolean;
}

type SetBadgeState = React.Dispatch<React.SetStateAction<BadgeState>>;

const BadgeContext = createContext<{
  badgeState: BadgeState;
  setBadgeState: SetBadgeState;
}>({
  badgeState: { action: false, personal: false, contact: true },
  setBadgeState: () => {
    throw new Error("setBadgeState function must be overridden by a provider");
  },
});

// Module-level variable to hold the external reference to setBadgeState
let externalSetBadgeState: SetBadgeState;

// Keys explicitly updated before the stored state finished loading; they
// must win over the stored values when the async load resolves (comparing
// against defaults would miss idempotent dismissals like "personal: false")
let storeLoaded = false;
const touchedBeforeLoad = new Set<keyof BadgeState>();

/**
 * A React context that provides badge state and its setter.
 * This context is used for managing application-wide badge states, such as action or personal badges.
 *
 * @param {React.ReactNode} children - The child components that will consume the badge context.
 */
export const BadgeProvider = ({ children }: { children: ReactNode }) => {
  const [badgeState, setBadgeState] = useState(BadgeStore.defaultState);
  const loaded = useRef(false);

  useEffect(() => {
    externalSetBadgeState = setBadgeState;
    storeLoaded = false;
    touchedBeforeLoad.clear();
    BadgeStore.getBadgeStore().then((storedState) => {
      // Stored values override the defaults, but keys already updated
      // before the async load resolved (e.g. a badge dismissed on first
      // focus) must not be reverted by the stored state
      setBadgeState((currentState) => {
        const merged = { ...storedState };
        for (const key of touchedBeforeLoad) {
          merged[key] = currentState[key];
        }
        return merged;
      });
      storeLoaded = true;
      loaded.current = true;
    });
  }, [setBadgeState]);

  // Persist changes so dismissed badges stay dismissed across restarts;
  // only after the stored state has loaded, or the defaults would clobber it
  useEffect(() => {
    if (loaded.current) {
      BadgeStore.setBadgeStore(badgeState);
    }
  }, [badgeState]);

  return (
    <BadgeContext.Provider value={{ badgeState, setBadgeState }}>
      {children}
    </BadgeContext.Provider>
  );
};

/**
 * Custom hook to use Badge context.
 *
 * Example usage:
 *
 * ```jsx
 * import { useBadge } from "./BadgeContext";
 *
 * const MyComponent = () => {
 *   const { badgeState, setBadgeState } = useBadge();
 *
 *   // Use `badgeState` and `setBadgeState` as needed
 * };
 * ```
 */
export const useBadge = () => useContext(BadgeContext);

/**
 * Updates the badge state with a new partial state.
 *
 * @param newState - The new state to merge into the current badge state.
 */
export const updateBadgeState = (newState: Partial<BadgeState>): void => {
  if (externalSetBadgeState) {
    if (!storeLoaded) {
      for (const key of Object.keys(newState) as (keyof BadgeState)[]) {
        touchedBeforeLoad.add(key);
      }
    }
    // Merge new state with previous badge state
    externalSetBadgeState((previousState: BadgeState) => ({
      ...previousState,
      ...newState,
    }));
  } else {
    console.warn("BadgeProvider is not mounted yet.");
  }
};
