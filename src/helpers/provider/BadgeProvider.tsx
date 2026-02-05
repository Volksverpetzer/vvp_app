import React, { createContext, useContext, useEffect, useState } from "react";

import BadgeStore from "#/helpers/Stores/BadgeStore";

export interface BadgeState {
  action: boolean;
  personal: boolean;
}

type SetBadgeState = React.Dispatch<React.SetStateAction<BadgeState>>;

const BadgeContext = createContext<{
  badgeState: BadgeState;
  setBadgeState: SetBadgeState;
}>({
  badgeState: { action: false, personal: false },
  setBadgeState: () => {
    throw new Error("setBadgeState function must be overridden by a provider");
  },
});

// Module-level variable to hold the external reference to setBadgeState
let externalSetBadgeState: SetBadgeState;

/**
 * A React context that provides badge state and its setter.
 * This context is used for managing application-wide badge states, such as action or personal badges.
 *
 * @param {React.ReactNode} children - The child components that will consume the badge context.
 */
export const BadgeProvider = ({ children }) => {
  const [badgeState, setBadgeState] = useState(BadgeStore.defaultState);

  useEffect(() => {
    externalSetBadgeState = setBadgeState;
    BadgeStore.getBadgeStore().then((storedState) => {
      setBadgeState(storedState);
    });
  }, [setBadgeState]);

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
    // Merge new state with previous badge state
    externalSetBadgeState((previousState: BadgeState) => ({
      ...previousState,
      ...newState,
    }));
  } else {
    console.warn("BadgeProvider is not mounted yet.");
  }
};
