import type { ToastConfig } from "react-native-toast-message";

import AppToast from "#/components/popups/AppToast";
import MissionPopup from "#/components/popups/MissionPopup";

// Every toast type renders the app's own AppToast, so all toasts look alike
// and follow the app's light/dark colors. The library always passes a no-op
// onPress; it is left out so plain messages aren't announced as buttons.
export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <AppToast variant="success" text1={text1} text2={text2} />
  ),
  info: ({ text1, text2 }) => (
    <AppToast variant="info" text1={text1} text2={text2} />
  ),
  error: ({ text1, text2 }) => (
    <AppToast variant="error" text1={text1} text2={text2} />
  ),
  achievement: ({ text1, text2 }) => (
    <MissionPopup text1={text1} text2={text2} />
  ),
};
