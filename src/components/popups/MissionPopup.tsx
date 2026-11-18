import { useRouter } from "expo-router";

import AppToast from "#/components/popups/AppToast";

interface MissionPopupProperties {
  text1: string;
  text2: string;
}

/**
 * The achievement toast: an `AppToast` that opens the action tab on tap.
 */
const MissionPopup = ({ text1, text2 }: MissionPopupProperties) => {
  const router = useRouter();
  return (
    <AppToast
      variant="achievement"
      text1={text1}
      text2={text2}
      testID="mission-popup"
      onPress={() => {
        if (router.canGoBack()) {
          router.dismissTo("/(tabs)/action");
        } else {
          router.replace("/(tabs)/action");
        }
      }}
    />
  );
};

export default MissionPopup;
