import { useShareIntentContext } from "expo-share-intent";

export const useOptionalShareIntent = () => {
  return useShareIntentContext();
};
