import Constants from "expo-constants";
import { useMemo } from "react";

/**
 * Zentrale Checks für die App-Variante.
 * Verwende `isVolksverpetzer` direkt oder `useIsVolksverpetzer()` in Komponenten.
 */
export const appName = Constants.expoConfig?.name ?? "";

export const isVolksverpetzer = appName === "Volksverpetzer";
export const isMimikama = appName === "Mimikama";

export const useIsVolksverpetzer = () => useMemo(() => isVolksverpetzer, []);
