import type { ToastConfig } from "react-native-toast-message";
import { BaseToast, ErrorToast } from "react-native-toast-message";

import MissionPopup from "#/components/popups/MissionPopup";
import ToastShareSheet from "#/components/popups/ToastShareSheet";
import { fontSizes } from "#/constants/FontSizes";

const TOAST_TEXT_STYLES = {
  text1Style: { fontSize: fontSizes.base },
  text2Style: { fontSize: fontSizes.sm },
};

export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast {...props} testID="toast.success" {...TOAST_TEXT_STYLES} />
  ),
  info: (props) => (
    <BaseToast {...props} testID="toast.info" {...TOAST_TEXT_STYLES} />
  ),
  error: (props) => (
    <ErrorToast {...props} testID="toast.error" {...TOAST_TEXT_STYLES} />
  ),
  achievement: ({ text1, text2 }) => (
    <MissionPopup text1={text1} text2={text2} />
  ),
  share: ({ props }) => (
    <ToastShareSheet items={props.items} onCancel={props.onCancel} />
  ),
};
