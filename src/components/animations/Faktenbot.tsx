import Constants from "expo-constants";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import type { RiveRef } from "rive-react-native";
import Rive from "rive-react-native";

export type FaktenbotReaction = 0 | 5 | 10;

interface FaktenbotProperties {
  reaction?: FaktenbotReaction;
  search?: boolean;
}

/**
 * Animated Faktenbot component that displays different reactions based on search state
 * @param reaction - The reaction state (0, 5, or 10)
 * @param search - Whether the component is in search mode
 */
const Faktenbot = ({ reaction, search }: FaktenbotProperties) => {
  const riveReference = useRef<RiveRef>(null);
  useEffect(() => {
    if (reaction === undefined || !riveReference.current) return;
    riveReference.current?.setInputState(
      "State Machine Search",
      "Reaktion",
      reaction,
    );
    riveReference.current?.fireState("State Machine Search", "ResultIn");
  }, [reaction]);

  useEffect(() => {
    if (search === undefined || !riveReference.current) return;
    riveReference.current?.setInputState(
      "State Machine Search",
      "Suche",
      search,
    );
  }, [search]);

  // Don't render in Web or Expo Go
  if (Platform.OS === "web" || Constants.executionEnvironment === "storeClient")
    return null;

  return (
    <Rive
      resourceName="faktenbot5"
      style={{
        maxWidth: 150,
        maxHeight: 150,
        width: "100%",
        height: "100%",
      }}
      ref={riveReference}
    />
  );
};

export default Faktenbot;
