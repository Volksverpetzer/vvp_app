import Constants from "expo-constants";
import { useEffect, useRef } from "react";
import Rive, { RiveRef } from "rive-react-native";

interface FaktenbotProperties {
  reaction?: undefined | 0 | 5 | 10;
  search?: boolean;
}

/**
 * Animated Faktenbot component that displays different reactions based on search state
 * @param reaction - The reaction state (0, 5, or 10)
 * @param search - Whether the component is in search mode
 */
const Faktenbot = ({ reaction, search }: FaktenbotProperties) => {
  // don't render in Expo Go

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

  // Don't render in Expo Go
  if (Constants.executionEnvironment === "standalone") return;

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
