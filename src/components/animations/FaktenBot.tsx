import { RiveView, useRive, useRiveFile } from "@rive-app/react-native";
import Constants from "expo-constants";
import { useEffect } from "react";
import { Platform } from "react-native";

export type FaktenBotReaction = 0 | 5 | 10;

interface FaktenBotProperties {
  reaction?: FaktenBotReaction;
  search?: boolean;
}

const FaktenBotRive = ({ reaction, search }: FaktenBotProperties) => {
  const { riveFile } = useRiveFile("faktenbot5");
  const { riveViewRef, setHybridRef } = useRive();

  useEffect(() => {
    if (reaction === undefined || !riveViewRef) return;
    riveViewRef.setNumberInputValue("Reaktion", reaction);
    riveViewRef.triggerInput("ResultIn");
  }, [reaction, riveViewRef]);

  useEffect(() => {
    if (search === undefined || !riveViewRef) return;
    riveViewRef.setBooleanInputValue("Suche", search);
  }, [search, riveViewRef]);

  if (!riveFile) return null;

  return (
    <RiveView
      autoPlay={true}
      file={riveFile}
      hybridRef={setHybridRef}
      stateMachineName="State Machine Search"
      style={{
        maxWidth: 150,
        maxHeight: 150,
        width: "100%",
        height: "100%",
      }}
    />
  );
};

/**
 * Animated FaktenBot component that displays different reactions based on search state
 * @param reaction - The reaction state (0, 5, or 10)
 * @param search - Whether the component is in search mode
 */
const FaktenBot = ({ reaction, search }: FaktenBotProperties) => {
  // Don't render in Web or Expo Go
  if (Platform.OS === "web" || Constants.executionEnvironment === "storeClient")
    return null;

  return <FaktenBotRive reaction={reaction} search={search} />;
};

export default FaktenBot;
